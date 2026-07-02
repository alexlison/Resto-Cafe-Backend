import mongoose from "mongoose";
import salesModel from "../models/sales.model.js";
import salesItemModel from "../models/salesItem.model.js";
import recipesModel from "../models/recipe.model.js";
import ingredientsModel from "../models/ingredient.model.js";
import purchaseBatchModel from "../models/purchaseBatch.model.js";
import { extractPDFText, parseSalesText, convertToDate } from "../utils/pdfParser.js";
import fs from "fs";

/**
 * Process uploaded sales PDF
 */
export const processSalesPDF = async (file, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const filePath = file.path;
    const fileName = file.filename;

    console.log("=== Processing Sales PDF ===");
    console.log("File:", fileName);
    console.log("File path:", filePath);

    // Step 1: Extract text from PDF
    const pdfText = await extractPDFText(filePath);
    if (!pdfText) {
      throw new Error("Failed to extract text from PDF");
    }

    // Write extracted text to file for debugging
    try {
      fs.writeFileSync('./debug_extracted_text.txt', pdfText);
      console.log("Extracted text written to debug_extracted_text.txt");
    } catch (err) {
      console.log("Could not write debug file:", err.message);
    }

    console.log("PDF Text extracted, length:", pdfText.length);

    // Step 2: Parse sales data
    const parsedData = parseSalesText(pdfText);
    console.log("Parsed sales date:", parsedData.salesDate);
    console.log("Parsed items count:", parsedData.items?.length || 0);

    if (!parsedData.salesDate) {
      throw new Error("Sales date not found in PDF");
    }

    const salesDate = convertToDate(parsedData.salesDate);
    if (!salesDate) {
      throw new Error(`Invalid sales date format: ${parsedData.salesDate}`);
    }

    console.log("Converted sales date:", salesDate);

    // Step 3: Check for duplicate upload
    const existingSales = await salesModel.findOne({ salesDate: salesDate }).session(session);
    if (existingSales) {
      throw new Error(`Sales data already exists for date: ${parsedData.salesDate}`);
    }

    // Step 4: Validate all items before processing
    const validatedItems = [];
    let totalGrossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalNetRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const item of parsedData.items) {
      // Skip invalid items
      if (item.quantity <= 0 || item.rate <= 0) {
        console.log("Skipping invalid item:", item);
        continue;
      }

      console.log("Processing item:", item.itemName);

      // Find recipe match
      const recipe = await findRecipeMatch(item.itemName);
      if (!recipe) {
        throw new Error(`Recipe not found for item: ${item.itemName}`);
      }

      console.log("Found recipe:", recipe.recipeName);

      // Check if recipe is active
      if (!recipe.isActive) {
        throw new Error(`Recipe is inactive: ${recipe.recipeName}`);
      }

      // Check if recipe has ingredients
      if (!recipe.recipeItems || recipe.recipeItems.length === 0) {
        throw new Error(`Recipe has no ingredients: ${recipe.recipeName}`);
      }

      // Get the first ingredient from recipe (for main ingredient reference)
      const firstIngredient = recipe.recipeItems[0];
      const ingredient = await ingredientsModel.findById(firstIngredient.ingredientId).session(session);
      if (!ingredient) {
        throw new Error(`Ingredient not found for recipe: ${recipe.recipeName}`);
      }

      // Check if ingredient is active
      if (!ingredient.isActive) {
        throw new Error(`Ingredient is inactive: ${ingredient.ingredientName}`);
      }

      console.log("Found ingredient:", ingredient.ingredientName);

      // Validate stock availability for all ingredients in recipe
      await validateStockForRecipe(recipe, item.quantity, session);

      // Calculate values
      const grossRevenue = recipe.sellingPrice * item.quantity;
      const netRevenue = grossRevenue - item.discount + item.tax;
      const costAmount = recipe.recipeCost * item.quantity;
      const profit = netRevenue - costAmount;

      validatedItems.push({
        recipeId: recipe._id,
        ingredientId: ingredient._id,
        quantity: item.quantity,
        pdfRate: item.rate,
        pdfTotal: item.total,
        taxAmount: item.tax,
        discountAmount: item.discount,
        saleAmount: item.saleAmount,
        grossRevenue: grossRevenue,
        netRevenue: netRevenue,
        costAmount: costAmount,
        profit: profit,
        pdfItemName: item.itemName
      });

      totalGrossRevenue += grossRevenue;
      totalDiscount += item.discount;
      totalTax += item.tax;
      totalNetRevenue += netRevenue;
      totalCost += costAmount;
      totalProfit += profit;
    }

    if (validatedItems.length === 0) {
      throw new Error("No valid items found in PDF. Please check the PDF format.");
    }

    console.log("Validated items count:", validatedItems.length);

    // Step 5: Create Sales record
    const salesData = {
      salesDate: salesDate,
      pdfFileName: fileName,
      pdfFilePath: filePath,
      totalGrossRevenue: Math.round(totalGrossRevenue),
      totalDiscount: Math.round(totalDiscount),
      totalTax: Math.round(totalTax),
      totalNetRevenue: Math.round(totalNetRevenue),
      totalCost: Math.round(totalCost),
      totalProfit: Math.round(totalProfit),
      totalItems: validatedItems.length,
      processedBy: userId
    };

    const sales = new salesModel(salesData);
    await sales.save({ session });

    console.log("Sales record created:", sales._id);

    // Step 6: Create Sales Items and Reduce Stock
    for (const item of validatedItems) {
      // Create sales item
      const salesItemData = {
        salesId: sales._id,
        recipeId: item.recipeId,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        pdfRate: item.pdfRate,
        pdfTotal: item.pdfTotal,
        taxAmount: item.taxAmount,
        discountAmount: item.discountAmount,
        saleAmount: item.saleAmount,
        grossRevenue: item.grossRevenue,
        netRevenue: item.netRevenue,
        costAmount: item.costAmount,
        profit: item.profit,
        pdfItemName: item.pdfItemName
      };

      const salesItem = new salesItemModel(salesItemData);
      await salesItem.save({ session });

      console.log("Sales item created for:", item.pdfItemName);

      // Reduce stock for all ingredients in recipe
      await reduceStockForRecipe(
        item.recipeId,
        item.quantity,
        sales._id,
        salesItem._id,
        session
      );
    }

    // Step 7: Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log("Sales transaction committed successfully");

    // Delete PDF file after successful processing
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("PDF file deleted:", filePath);
      }
    } catch (err) {
      console.error("Error deleting PDF file:", err);
    }

    return {
      sales: sales,
      items: validatedItems.length,
      message: "Sales data processed successfully"
    };

  } catch (error) {
    console.error("Error processing sales PDF:", error.message);

    // Rollback transaction
    await session.abortTransaction();
    session.endSession();

    // Delete PDF file if exists
    try {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log("Deleted PDF file after error:", file.path);
      }
    } catch (err) {
      console.error("Error deleting PDF file:", err);
    }

    throw error;
  }
};

/**
 * Find recipe match by item name
 */
export const findRecipeMatch = async (itemName) => {
  if (!itemName) return null;

  // Clean item name for better matching
  const cleanItemName = itemName.trim();

  // Try exact match first (case insensitive)
  let recipe = await recipesModel.findOne({
    recipeName: { $regex: new RegExp(`^${escapeRegex(cleanItemName)}$`, 'i') },
    isActive: true
  });

  if (recipe) return recipe;

  // Try partial match (contains)
  recipe = await recipesModel.findOne({
    recipeName: { $regex: escapeRegex(cleanItemName), $options: 'i' },
    isActive: true
  });

  if (recipe) return recipe;

  // Try removing common words/suffixes
  const variations = generateNameVariations(cleanItemName);
  for (const variation of variations) {
    recipe = await recipesModel.findOne({
      recipeName: { $regex: escapeRegex(variation), $options: 'i' },
      isActive: true
    });
    if (recipe) return recipe;
  }

  return null;
};

/**
 * Escape regex special characters
 */
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Generate variations of item name for matching
 */
const generateNameVariations = (name) => {
  const variations = [];

  // Remove everything in parentheses
  let cleaned = name.replace(/\([^)]*\)/g, '').trim();
  if (cleaned !== name) variations.push(cleaned);

  // Remove common suffixes
  cleaned = name.replace(/\s*(Classic|Large|Medium|Small|Regular|Special|Premium|Deluxe|Single|Double|Triple|Mini|Maxi|With.*?)$/i, '').trim();
  if (cleaned !== name) variations.push(cleaned);

  // Remove common prefixes
  cleaned = name.replace(/^(Crispy|Loaded|Spicy|Cheesy|Grilled|Fried|Baked|Roasted|Tender|Creamy)\s*/i, '').trim();
  if (cleaned !== name) variations.push(cleaned);

  // Remove both prefix and suffix
  const withoutPrefix = name.replace(/^(Crispy|Loaded|Spicy|Cheesy|Grilled|Fried|Baked|Roasted|Tender|Creamy)\s*/i, '').trim();
  const withoutBoth = withoutPrefix.replace(/\s*(Classic|Large|Medium|Small|Regular|Special|Premium|Deluxe|Single|Double|Triple|Mini|Maxi|With.*?)$/i, '').trim();
  if (withoutBoth !== name && withoutBoth !== cleaned) variations.push(withoutBoth);

  return variations;
};

/**
 * Validate stock availability for all ingredients in a recipe
 */
export const validateStockForRecipe = async (recipe, quantity, session) => {
  for (const recipeItem of recipe.recipeItems) {
    const ingredientId = recipeItem.ingredientId;
    const requiredQuantity = recipeItem.quantity * quantity;

    if (requiredQuantity <= 0) continue;

    // Get active batches for this ingredient (FIFO order by expiry date)
    const batches = await purchaseBatchModel.find({
      ingredientId: ingredientId,
      batchStatus: "ACTIVE",
      remainingQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() } // Not expired
    })
      .sort({ expiryDate: 1, createdAt: 1 })
      .session(session);

    if (batches.length === 0) {
      const ingredient = await ingredientsModel.findById(ingredientId).session(session);
      throw new Error(`No stock available for ingredient: ${ingredient?.ingredientName || 'Unknown'}`);
    }

    let totalAvailable = 0;
    for (const batch of batches) {
      totalAvailable += batch.remainingQuantity;
    }

    if (totalAvailable < requiredQuantity) {
      const ingredient = await ingredientsModel.findById(ingredientId).session(session);
      throw new Error(
        `Insufficient stock for ingredient: ${ingredient?.ingredientName || 'Unknown'}. ` +
        `Required: ${requiredQuantity}, Available: ${totalAvailable}`
      );
    }
  }
};

/**
 * Reduce stock for all ingredients in a recipe using FIFO
 */
export const reduceStockForRecipe = async (recipeId, quantity, salesId, salesItemId, session) => {
  const recipe = await recipesModel.findById(recipeId).session(session);
  if (!recipe) {
    throw new Error(`Recipe not found: ${recipeId}`);
  }

  for (const recipeItem of recipe.recipeItems) {
    const ingredientId = recipeItem.ingredientId;
    const requiredQuantity = recipeItem.quantity * quantity;

    if (requiredQuantity <= 0) continue;

    // Get active batches for this ingredient (FIFO order by expiry date)
    const batches = await purchaseBatchModel.find({
      ingredientId: ingredientId,
      batchStatus: "ACTIVE",
      remainingQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() } // Not expired
    })
      .sort({ expiryDate: 1, createdAt: 1 })
      .session(session);

    if (batches.length === 0) {
      const ingredient = await ingredientsModel.findById(ingredientId).session(session);
      throw new Error(`No stock available for ingredient: ${ingredient?.ingredientName || 'Unknown'}`);
    }

    let remainingToConsume = requiredQuantity;

    for (const batch of batches) {
      if (remainingToConsume <= 0) break;

      const previousRemaining = batch.remainingQuantity;
      const consumeQuantity = Math.min(batch.remainingQuantity, remainingToConsume);

      // Update batch
      batch.remainingQuantity -= consumeQuantity;

      // Update batch status
      if (batch.remainingQuantity <= 0) {
        batch.batchStatus = "EMPTY";
      }

      // Check if expired
      if (batch.expiryDate && new Date() > batch.expiryDate) {
        batch.batchStatus = "EXPIRED";
      }

      await batch.save({ session });

      remainingToConsume -= consumeQuantity;
    }

    if (remainingToConsume > 0) {
      const ingredient = await ingredientsModel.findById(ingredientId).session(session);
      throw new Error(
        `Failed to consume stock for ingredient: ${ingredient?.ingredientName || 'Unknown'}. ` +
        `Remaining to consume: ${remainingToConsume}`
      );
    }
  }
};

/**
 * Get all sales records with pagination
 */
export const getAllSales = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const sales = await salesModel.find()
    .sort({ salesDate: -1 })
    .skip(skip)
    .limit(limit)
    .populate("processedBy", "staff.name staff.email");

  const total = await salesModel.countDocuments();

  return {
    sales: sales,
    total: total,
    page: page,
    limit: limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get sales by date range
 */
export const getSalesByDateRange = async (fromDate, toDate) => {
  const sales = await salesModel.find({
    salesDate: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate)
    }
  })
    .sort({ salesDate: -1 })
    .populate("processedBy", "staff.name staff.email");

  return sales;
};

/**
 * Get sales details with items
 */
export const getSalesDetails = async (salesId) => {
  const sales = await salesModel.findById(salesId)
    .populate("processedBy", "staff.name staff.email");

  if (!sales) {
    throw new Error("Sales record not found");
  }

  const items = await salesItemModel.find({ salesId: salesId })
    .populate("recipeId", "recipeName sellingPrice recipeCost")
    .populate("ingredientId", "ingredientName unit");

  return {
    sales: sales,
    items: items
  };
};

/**
 * Get sales summary for dashboard
 */
export const getSalesSummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todaySales, weekSales, monthSales, topProducts] = await Promise.all([
    // Today's sales
    salesModel.aggregate([
      { $match: { salesDate: { $gte: today } } },
      {
        $group: {
          _id: null,
          totalNetRevenue: { $sum: "$totalNetRevenue" },
          totalProfit: { $sum: "$totalProfit" },
          totalItems: { $sum: "$totalItems" }
        }
      }
    ]),

    // Week sales
    salesModel.aggregate([
      { $match: { salesDate: { $gte: startOfWeek } } },
      {
        $group: {
          _id: null,
          totalNetRevenue: { $sum: "$totalNetRevenue" },
          totalProfit: { $sum: "$totalProfit" }
        }
      }
    ]),

    // Month sales
    salesModel.aggregate([
      { $match: { salesDate: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalNetRevenue: { $sum: "$totalNetRevenue" },
          totalProfit: { $sum: "$totalProfit" }
        }
      }
    ]),

    // Top 5 selling products
    salesItemModel.aggregate([
      {
        $group: {
          _id: "$recipeId",
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: "$grossRevenue" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "recipes",
          localField: "_id",
          foreignField: "_id",
          as: "recipe"
        }
      },
      { $unwind: "$recipe" },
      {
        $project: {
          recipeName: "$recipe.recipeName",
          totalQuantity: 1,
          totalRevenue: 1
        }
      }
    ])
  ]);

  return {
    today: {
      revenue: todaySales[0]?.totalNetRevenue || 0,
      profit: todaySales[0]?.totalProfit || 0,
      items: todaySales[0]?.totalItems || 0
    },
    week: {
      revenue: weekSales[0]?.totalNetRevenue || 0,
      profit: weekSales[0]?.totalProfit || 0
    },
    month: {
      revenue: monthSales[0]?.totalNetRevenue || 0,
      profit: monthSales[0]?.totalProfit || 0
    },
    topProducts: topProducts || []
  };
};

/**
 * Delete sales record (for admin only)
 */
export const deleteSales = async (salesId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find sales record
    const sales = await salesModel.findById(salesId).session(session);
    if (!sales) {
      throw new Error("Sales record not found");
    }

    // Delete all sales items
    await salesItemModel.deleteMany({ salesId: salesId }).session(session);

    // Delete sales record
    await salesModel.findByIdAndDelete(salesId).session(session);

    await session.commitTransaction();
    session.endSession();

    return { message: "Sales record deleted successfully" };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};