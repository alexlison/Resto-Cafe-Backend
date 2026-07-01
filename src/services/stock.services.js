import ingredients from '../models/ingredient.model.js';
import categories from '../models/category.model.js';
import brands from '../models/brand.model.js';
import purchases from '../models/purchase.model.js';
import purchaseBatches from '../models/purchaseBatch.model.js';

// Get Stock Data Service
export const getStockDataService = async () => {
  try {
    // Fetch all ingredients with their category and brand
    const allIngredients = await ingredients.find()
      .populate('categoryId', 'categoryName')
      .populate('brandId', 'brandName')
      .lean();

    // Fetch all categories for reference
    const allCategories = await categories.find().lean();
    
    // Fetch all brands for reference
    const allBrands = await brands.find().lean();

    // Fetch all purchase batches to calculate stock quantities
    const allBatches = await purchaseBatches.find().lean();

    // Group batches by ingredientId to calculate total stock
    const stockMap = {};
    
    allBatches.forEach(batch => {
      const ingredientId = batch.ingredientId.toString();
      if (!stockMap[ingredientId]) {
        stockMap[ingredientId] = {
          totalQuantity: 0,
          totalCost: 0,
          batches: [],
          lastPurchaseDate: null
        };
      }
      
      stockMap[ingredientId].totalQuantity += batch.remainingQuantity || batch.quantity || 0;
      stockMap[ingredientId].totalCost += batch.totalCost || 0;
      stockMap[ingredientId].batches.push({
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        remainingQuantity: batch.remainingQuantity,
        unitCost: batch.unitCost,
        totalCost: batch.totalCost,
        manufacturingDate: batch.manufacturingDate,
        expiryDate: batch.expiryDate,
        createdAt: batch.createdAt
      });
      
      // Track last purchase date
      if (!stockMap[ingredientId].lastPurchaseDate || 
          new Date(batch.createdAt) > new Date(stockMap[ingredientId].lastPurchaseDate)) {
        stockMap[ingredientId].lastPurchaseDate = batch.createdAt;
      }
    });

    // Build stock data with all information
    const stockData = allIngredients.map(ingredient => {
      const ingredientId = ingredient._id.toString();
      const stockInfo = stockMap[ingredientId] || {
        totalQuantity: 0,
        totalCost: 0,
        batches: [],
        lastPurchaseDate: null
      };

      // Calculate stock status based on quantity and min stock
      let stockStatus = 'In Stock';
      let statusColor = 'green';
      
      if (stockInfo.totalQuantity === 0) {
        stockStatus = 'Out of Stock';
        statusColor = 'red';
      } else if (stockInfo.totalQuantity < 10) {
        stockStatus = 'Low Stock';
        statusColor = 'yellow';
      }

      return {
        _id: ingredient._id,
        ingredientName: ingredient.ingredientName,
        categoryId: ingredient.categoryId,
        categoryName: ingredient.categoryId?.categoryName || 'N/A',
        subCategoryId: ingredient.subCategoryId || null,
        brandId: ingredient.brandId,
        brandName: ingredient.brandId?.brandName || 'N/A',
        unit: ingredient.unit,
        costPrice: ingredient.costPrice,
        ingredientImage: ingredient.ingredientImage,
        isActive: ingredient.isActive,
        createdAt: ingredient.createdAt,
        updatedAt: ingredient.updatedAt,
        // Stock information
        totalQuantity: stockInfo.totalQuantity,
        totalCost: stockInfo.totalCost,
        stockStatus: stockStatus,
        statusColor: statusColor,
        lastPurchaseDate: stockInfo.lastPurchaseDate,
        batches: stockInfo.batches,
        // Calculate average cost per unit
        averageCost: stockInfo.totalQuantity > 0 
          ? Math.round((stockInfo.totalCost / stockInfo.totalQuantity) * 100) / 100 
          : 0
      };
    });

    // Sort by stock status (Out of Stock first, then Low Stock, then In Stock)
    const statusOrder = { 'Out of Stock': 0, 'Low Stock': 1, 'In Stock': 2 };
    stockData.sort((a, b) => statusOrder[a.stockStatus] - statusOrder[b.stockStatus]);

    // Get summary statistics
    const summary = {
      totalIngredients: stockData.length,
      totalStockValue: stockData.reduce((sum, item) => sum + item.totalCost, 0),
      totalItems: stockData.reduce((sum, item) => sum + item.totalQuantity, 0),
      outOfStock: stockData.filter(item => item.stockStatus === 'Out of Stock').length,
      lowStock: stockData.filter(item => item.stockStatus === 'Low Stock').length,
      inStock: stockData.filter(item => item.stockStatus === 'In Stock').length,
      activeIngredients: stockData.filter(item => item.isActive).length,
      inactiveIngredients: stockData.filter(item => !item.isActive).length
    };

    return {
      summary,
      stockData
    };

  } catch (error) {
    throw new Error(error.message || 'Error fetching stock data');
  }
};