import mongoose from "mongoose";
import ingredients from '../models/ingredient.model.js';
import categories from '../models/category.model.js';
import brands from '../models/brand.model.js';
import purchases from '../models/purchase.model.js';
import purchaseBatches from '../models/purchaseBatch.model.js';

// Update Batch Status for the Expired Batch
export const updateBatchStatuses = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = new Date();
    
    // Find all active batches
    const batches = await purchaseBatches.find({
      batchStatus: "ACTIVE"
    }).session(session);

    let updatedCount = 0;
    const updates = [];

    for (const batch of batches) {
      let statusChanged = false;
      let newStatus = batch.batchStatus;

      // Check if expired
      if (batch.expiryDate && new Date(batch.expiryDate) < now) {
        newStatus = "EXPIRED";
        statusChanged = true;
      }
      // Check if empty
      else if (batch.remainingQuantity <= 0) {
        newStatus = "EMPTY";
        statusChanged = true;
      }

      if (statusChanged) {
        const oldStatus = batch.batchStatus;
        batch.batchStatus = newStatus;
        await batch.save({ session });
        updatedCount++;
        updates.push({
          batchNumber: batch.batchNumber,
          oldStatus: oldStatus,
          newStatus: newStatus,
          remainingQuantity: batch.remainingQuantity,
          expiryDate: batch.expiryDate
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return {
      updatedCount: updatedCount,
      updates: updates
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Get Stock Data Service
export const getStockDataService = async () => {
  try {
    // First update status of Expired Batches
    await updateBatchStatuses();

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
      
      // Only add non-expired batches to total quantity
      if (batch.batchStatus !== 'EXPIRED') {
        stockMap[ingredientId].totalQuantity += batch.remainingQuantity || batch.quantity || 0;
        stockMap[ingredientId].totalCost += batch.totalCost || 0;
      }
      
      stockMap[ingredientId].batches.push({
        batchNumber: batch.batchNumber,
        batchStatus: batch.batchStatus,
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

      // Check for expired batches with quantity > 0
      const expiredBatches = stockInfo.batches.filter(b => b.batchStatus === 'EXPIRED' && b.remainingQuantity > 0);
      const hasExpiredBatches = expiredBatches.length > 0;
      const allBatchesExpired = stockInfo.batches.length > 0 && 
        stockInfo.batches.every(b => b.batchStatus === 'EXPIRED');

      // Calculate stock status based on quantity and min stock
      let stockStatus = 'In Stock';
      let statusColor = 'green';
      
      if (allBatchesExpired || (hasExpiredBatches && stockInfo.totalQuantity === 0)) {
        stockStatus = 'Expired';
        statusColor = 'gray';
      } else if (stockInfo.totalQuantity === 0) {
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
        expiredBatches: expiredBatches,
        hasExpiredBatches: hasExpiredBatches,
        allBatchesExpired: allBatchesExpired,
        // Calculate average cost per unit
        averageCost: stockInfo.totalQuantity > 0 
          ? Math.round((stockInfo.totalCost / stockInfo.totalQuantity) * 100) / 100 
          : 0
      };
    });

    // Sort by stock status (Out of Stock first, then Low Stock, then In Stock, then Expired)
    const statusOrder = { 'Expired': 0, 'Out of Stock': 1, 'Low Stock': 2, 'In Stock': 3 };
    stockData.sort((a, b) => statusOrder[a.stockStatus] - statusOrder[b.stockStatus]);

    // Get summary statistics
    const summary = {
      totalIngredients: stockData.length,
      totalStockValue: stockData.reduce((sum, item) => sum + item.totalCost, 0),
      totalItems: stockData.reduce((sum, item) => sum + item.totalQuantity, 0),
      outOfStock: stockData.filter(item => item.stockStatus === 'Out of Stock').length,
      lowStock: stockData.filter(item => item.stockStatus === 'Low Stock').length,
      inStock: stockData.filter(item => item.stockStatus === 'In Stock').length,
      expired: stockData.filter(item => item.hasExpiredBatches && item.stockStatus === 'Expired').length,
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