import mongoose from "mongoose";
import salesModel from "../models/sales.model.js";
import salesItemModel from "../models/salesItem.model.js";
import stockTransactionModel from "../models/stockTransaction.model.js";
import recipesModel from "../models/recipe.model.js";
import ingredientsModel from "../models/ingredient.model.js";
import purchaseBatchModel from "../models/purchaseBatch.model.js";
import { extractPDFText, parseSalesText, convertToDate } from "../utils/pdfParser.js";
import fs from "fs";

// ============================================
// Helper Functions
// ============================================

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeName = (str) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

const levenshteinDistance = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
};

const similarityRatio = (a, b) => {
  const an = normalizeName(a);
  const bn = normalizeName(b);
  const maxLen = Math.max(an.length, bn.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(an, bn) / maxLen;
};

const FUZZY_MATCH_THRESHOLD = 0.78;

const WEIGHT_TO_GRAMS = { mg: 0.001, g: 1, kg: 1000 };
const VOLUME_TO_ML = { ml: 1, ltr: 1000 };

const convertQuantity = (qty, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return qty;
  if (fromUnit in WEIGHT_TO_GRAMS && toUnit in WEIGHT_TO_GRAMS) {
    return (qty * WEIGHT_TO_GRAMS[fromUnit]) / WEIGHT_TO_GRAMS[toUnit];
  }
  if (fromUnit in VOLUME_TO_ML && toUnit in VOLUME_TO_ML) {
    return (qty * VOLUME_TO_ML[fromUnit]) / VOLUME_TO_ML[toUnit];
  }
  return qty;
};

const inferLegacyBaseUnit = (ingredientUnit) => {
  if (ingredientUnit === "kg" || ingredientUnit === "g") return "g";
  if (ingredientUnit === "ltr" || ingredientUnit === "ml") return "ml";
  return ingredientUnit;
};

const convertRecipeQtyToStockUnit = (recipeQty, recipeItemUnit, ingredientUnit) => {
  const fromUnit = recipeItemUnit || inferLegacyBaseUnit(ingredientUnit);
  return convertQuantity(recipeQty, fromUnit, ingredientUnit);
};

// ============================================
// Normalize PDF file Path
// ============================================

const normalizeFilePath = (filePath) => {
  return filePath.replace(/\\/g, "/");
};

// ============================================
// Recipe Matching
// ============================================

export const findRecipeMatch = async (itemName) => {
  if (!itemName) return null;

  const name = itemName.trim();
  const safeName = escapeRegex(name);

  // Exact match
  let recipe = await recipesModel.findOne({
    recipeName: { $regex: new RegExp(`^${safeName}$`, 'i') },
    isActive: true
  });
  if (recipe) return recipe;

  // Partial match
  recipe = await recipesModel.findOne({
    recipeName: { $regex: safeName, $options: 'i' },
    isActive: true
  });
  if (recipe) return recipe;

  // Variations
  const variations = [
    name.replace(/\([^)]*\)/g, '').trim(),
    name.replace(/\s*(Classic|Large|Medium|Small|Regular|Special|Premium|Deluxe).*$/i, '').trim(),
    name.replace(/^(Crispy|Loaded|Spicy|Cheesy|Grilled|Fried|Baked|Roasted)\s*/i, '').trim()
  ];

  for (const variant of variations) {
    if (variant && variant !== name) {
      recipe = await recipesModel.findOne({
        recipeName: { $regex: escapeRegex(variant), $options: 'i' },
        isActive: true
      });
      if (recipe) return recipe;
    }
  }

  // Fuzzy fallback
  const activeRecipes = await recipesModel.find({ isActive: true });
  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of activeRecipes) {
    const score = similarityRatio(name, candidate.recipeName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (bestMatch && bestScore >= FUZZY_MATCH_THRESHOLD) {
    console.warn(`Fuzzy-matched "${name}" to "${bestMatch.recipeName}" (${bestScore.toFixed(2)})`);
    return bestMatch;
  }

  return null;
};

// ============================================
// Get All Ingredients for a Recipe
// ============================================

export const getRecipeIngredients = async (recipeId) => {
  const recipe = await recipesModel.findById(recipeId).populate('recipeItems.ingredientId');
  if (!recipe) return [];
  
  const ingredients = [];
  for (const item of recipe.recipeItems) {
    if (item.ingredientId) {
      ingredients.push({
        ingredientId: item.ingredientId._id,
        ingredientName: item.ingredientId.ingredientName,
        unit: item.ingredientId.unit,
        quantity: item.quantity,
        recipeItemUnit: item.unit || inferLegacyBaseUnit(item.ingredientId.unit),
        costPrice: item.ingredientId.costPrice
      });
    }
  }
  return ingredients;
};

// ============================================
// Stock Validation
// ============================================

export const validateStock = async (recipe, quantity, session = null) => {
  for (const item of recipe.recipeItems) {
    const recipeQtyNeeded = item.quantity * quantity;
    if (recipeQtyNeeded <= 0) continue;

    const ingredient = await ingredientsModel.findById(item.ingredientId).session(session);
    if (!ingredient) throw new Error(`Ingredient not found: ${item.ingredientId}`);

    const required = convertRecipeQtyToStockUnit(recipeQtyNeeded, item.unit, ingredient.unit);

    const batches = await purchaseBatchModel.find({
      ingredientId: item.ingredientId,
      batchStatus: "ACTIVE",
      remainingQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: 1 }).session(session);

    const totalAvailable = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
    if (totalAvailable < required) {
      throw new Error(`Insufficient stock: ${ingredient.ingredientName}. Required: ${required} ${ingredient.unit}, Available: ${totalAvailable} ${ingredient.unit}`);
    }
  }
};

// ============================================
// FIFO Stock Reduction
// ============================================

export const reduceStockFIFO = async (recipeId, quantity, salesId, salesItemId, session) => {
  const recipe = await recipesModel.findById(recipeId).session(session);
  if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);

  for (const item of recipe.recipeItems) {
    const recipeQtyNeeded = item.quantity * quantity;
    if (recipeQtyNeeded <= 0) continue;

    const ingredient = await ingredientsModel.findById(item.ingredientId).session(session);
    if (!ingredient) throw new Error(`Ingredient not found: ${item.ingredientId}`);

    const required = convertRecipeQtyToStockUnit(recipeQtyNeeded, item.unit, ingredient.unit);

    const batches = await purchaseBatchModel.find({
      ingredientId: item.ingredientId,
      batchStatus: "ACTIVE",
      remainingQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: 1, createdAt: 1 }).session(session);

    let remaining = required;
    for (const batch of batches) {
      if (remaining <= 0) break;

      const consume = Math.min(batch.remainingQuantity, remaining);
      batch.remainingQuantity -= consume;
      batch.batchStatus = batch.remainingQuantity <= 0 ? "EMPTY" : batch.batchStatus;
      if (batch.expiryDate && new Date() > batch.expiryDate) batch.batchStatus = "EXPIRED";
      await batch.save({ session });

      const transaction = new stockTransactionModel({
        ingredientId: item.ingredientId,
        batchId: batch._id,
        salesId,
        salesItemId,
        quantity: consume,
        type: "SALE",
        description: `Consumed for: ${recipe.recipeName}`
      });
      await transaction.save({ session });

      remaining -= consume;
    }

    if (remaining > 0) {
      throw new Error(`Failed to consume stock: ${ingredient.ingredientName}. Remaining: ${remaining} ${ingredient.unit}`);
    }
  }
};

// ============================================
// Preview Sales PDF
// ============================================

export const previewSalesPDF = async (file) => {
  try {
    const filePath = normalizeFilePath(file.path);
    const fileName = file.filename;

    const pdfText = await extractPDFText(file.path);
    if (!pdfText) throw new Error("Failed to extract text from PDF");

    const parsedData = parseSalesText(pdfText);
    if (!parsedData.salesDate) throw new Error("Sales date not found in PDF");

    const salesDate = convertToDate(parsedData.salesDate);
    if (!salesDate) throw new Error(`Invalid sales date: ${parsedData.salesDate}`);

    const previewItems = [];
    let totalGross = 0, totalDiscount = 0, totalTax = 0, totalNet = 0, totalCost = 0, totalProfit = 0;

    for (const item of parsedData.items) {
      if (item.quantity <= 0 || item.rate <= 0) continue;

      const recipe = await findRecipeMatch(item.itemName);
      
      let recipeFound = !!recipe;
      let ingredientList = [];
      let stockAvailable = false;
      let stockDetails = null;

      if (recipe) {
        if (recipe.isActive && recipe.recipeItems?.length) {
          ingredientList = await getRecipeIngredients(recipe._id);
          
          if (ingredientList.length > 0) {
            try {
              await validateStock(recipe, item.quantity);
              stockAvailable = true;
            } catch (stockError) {
              stockAvailable = false;
              stockDetails = stockError.message;
            }
          }
        }
      }

      let gross = 0, net = 0, cost = 0, profit = 0;
      if (recipe && ingredientList.length > 0) {
        gross = recipe.sellingPrice * item.quantity;
        net = gross - (item.discount || 0) + (item.tax || 0);
        cost = recipe.recipeCost * item.quantity;
        profit = net - cost;
      }

      previewItems.push({
        pdfItemName: item.itemName,
        quantity: item.quantity,
        pdfRate: item.rate,
        pdfTotal: item.total,
        tax: item.tax || 0,
        discount: item.discount || 0,
        saleAmount: item.saleAmount || item.total,
        recipeFound,
        recipeId: recipe?._id || null,
        recipeName: recipe?.recipeName || null,
        recipeImage: recipe?.recipeImage || null,
        sellingPrice: recipe?.sellingPrice || null,
        ingredients: ingredientList,
        grossRevenue: gross,
        netRevenue: net,
        costAmount: cost,
        profit: profit,
        stockAvailable,
        stockDetails,
        isManual: false
      });

      if (recipe && ingredientList.length > 0) {
        totalGross += gross;
        totalDiscount += item.discount || 0;
        totalTax += item.tax || 0;
        totalNet += net;
        totalCost += cost;
        totalProfit += profit;
      }
    }

    return {
      salesDate: salesDate,
      salesDateString: parsedData.salesDate,
      items: previewItems,
      totalGrossRevenue: Math.round(totalGross),
      totalDiscount: Math.round(totalDiscount),
      totalTax: Math.round(totalTax),
      totalNetRevenue: Math.round(totalNet),
      totalCost: Math.round(totalCost),
      totalProfit: Math.round(totalProfit),
      totalItems: previewItems.length,
      validItems: previewItems.filter(i => i.recipeFound && i.stockAvailable).length,
      invalidItems: previewItems.filter(i => !i.recipeFound || !i.stockAvailable).length,
      pdfFileName: fileName,
      pdfFilePath: filePath
    };
  } catch (error) {
    throw error;
  }
};

// ============================================
// Approve Sales PDF
// ============================================

export const approveSalesPDF = async (file, userId, manualItems = []) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const filePath = normalizeFilePath(file.path);
    const fileName = file.filename;

    const pdfText = await extractPDFText(file.path);
    if (!pdfText) throw new Error("Failed to extract text from PDF");

    const parsedData = parseSalesText(pdfText);
    if (!parsedData.salesDate) throw new Error("Sales date not found in PDF");

    const salesDate = convertToDate(parsedData.salesDate);
    if (!salesDate) throw new Error(`Invalid sales date: ${parsedData.salesDate}`);

    // Check duplicate
    const existing = await salesModel.findOne({ salesDate }).session(session);
    if (existing) throw new Error(`Sales already exists for date: ${parsedData.salesDate}`);

    // Process items - combine PDF items with manual items
    const allItems = [...parsedData.items, ...manualItems];
    const validatedItems = [];
    let totalGross = 0, totalDiscount = 0, totalTax = 0, totalNet = 0, totalCost = 0, totalProfit = 0;

    for (const item of allItems) {
      if (item.quantity <= 0) continue;

      let recipe;
      if (item.recipeId) {
        recipe = await recipesModel.findById(item.recipeId).session(session);
      } else {
        recipe = await findRecipeMatch(item.itemName);
      }

      if (!recipe) throw new Error(`Recipe not found for: ${item.itemName}`);
      if (!recipe.isActive) throw new Error(`Recipe inactive: ${recipe.recipeName}`);
      if (!recipe.recipeItems?.length) throw new Error(`Recipe has no ingredients: ${recipe.recipeName}`);

      // Validate stock
      await validateStock(recipe, item.quantity, session);

      // Use RECIPE selling price and cost
      const gross = recipe.sellingPrice * item.quantity;
      const net = gross - (item.discount || 0) + (item.tax || 0);
      const cost = recipe.recipeCost * item.quantity;
      const profit = net - cost;

      validatedItems.push({
        recipeId: recipe._id,
        quantity: item.quantity,
        pdfRate: item.rate || recipe.sellingPrice,
        pdfTotal: item.total || gross,
        taxAmount: item.tax || 0,
        discountAmount: item.discount || 0,
        saleAmount: net,
        grossRevenue: gross,
        netRevenue: net,
        costAmount: cost,
        profit: profit,
        pdfItemName: item.itemName
      });

      totalGross += gross;
      totalDiscount += item.discount || 0;
      totalTax += item.tax || 0;
      totalNet += net;
      totalCost += cost;
      totalProfit += profit;
    }

    if (validatedItems.length === 0) {
      throw new Error("No valid items found");
    }

    // Create sales record
    const sales = new salesModel({
      salesDate,
      pdfFileName: fileName,
      pdfFilePath: filePath,
      totalGrossRevenue: Math.round(totalGross),
      totalDiscount: Math.round(totalDiscount),
      totalTax: Math.round(totalTax),
      totalNetRevenue: Math.round(totalNet),
      totalCost: Math.round(totalCost),
      totalProfit: Math.round(totalProfit),
      totalItems: validatedItems.length,
      processedBy: userId
    });
    await sales.save({ session });

    // Create sales items and reduce stock
    for (const item of validatedItems) {
      const salesItem = new salesItemModel({
        salesId: sales._id,
        recipeId: item.recipeId,
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
      });
      await salesItem.save({ session });

      // Reduce stock using FIFO
      await reduceStockFIFO(item.recipeId, item.quantity, sales._id, salesItem._id, session);
    }

    await session.commitTransaction();
    session.endSession();

    return { sales, items: validatedItems.length };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ============================================
// Add Manual Sales
// ============================================

export const addManualSales = async (salesDateStr, items, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const salesDate = convertToDate(salesDateStr);
    if (!salesDate) throw new Error(`Invalid sales date: ${salesDateStr}`);

    // Check duplicate
    const existing = await salesModel.findOne({ salesDate }).session(session);
    if (existing) throw new Error(`Sales already exists for date: ${salesDateStr}`);

    // Process items
    const validatedItems = [];
    let totalGross = 0, totalDiscount = 0, totalTax = 0, totalNet = 0, totalCost = 0, totalProfit = 0;

    for (const item of items) {
      let recipe;
      if (item.recipeId) {
        recipe = await recipesModel.findById(item.recipeId).session(session);
      } else {
        recipe = await findRecipeMatch(item.itemName);
      }

      if (!recipe) throw new Error(`Recipe not found for: ${item.itemName}`);
      if (!recipe.isActive) throw new Error(`Recipe inactive: ${recipe.recipeName}`);
      if (!recipe.recipeItems?.length) throw new Error(`Recipe has no ingredients: ${recipe.recipeName}`);

      // Validate stock
      await validateStock(recipe, item.quantity, session);

      // Use RECIPE selling price and cost
      const gross = recipe.sellingPrice * item.quantity;
      const net = gross - (item.discount || 0) + (item.tax || 0);
      const cost = recipe.recipeCost * item.quantity;
      const profit = net - cost;

      validatedItems.push({
        recipeId: recipe._id,
        quantity: item.quantity,
        pdfRate: item.rate || recipe.sellingPrice,
        pdfTotal: gross,
        taxAmount: item.tax || 0,
        discountAmount: item.discount || 0,
        saleAmount: net,
        grossRevenue: gross,
        netRevenue: net,
        costAmount: cost,
        profit: profit,
        pdfItemName: item.itemName
      });

      totalGross += gross;
      totalDiscount += item.discount || 0;
      totalTax += item.tax || 0;
      totalNet += net;
      totalCost += cost;
      totalProfit += profit;
    }

    // Create sales record
    const sales = new salesModel({
      salesDate,
      pdfFileName: `manual_${Date.now()}`,
      pdfFilePath: `manual_${Date.now()}`,
      totalGrossRevenue: Math.round(totalGross),
      totalDiscount: Math.round(totalDiscount),
      totalTax: Math.round(totalTax),
      totalNetRevenue: Math.round(totalNet),
      totalCost: Math.round(totalCost),
      totalProfit: Math.round(totalProfit),
      totalItems: validatedItems.length,
      processedBy: userId
    });
    await sales.save({ session });

    // Create sales items and reduce stock
    for (const item of validatedItems) {
      const salesItem = new salesItemModel({
        salesId: sales._id,
        recipeId: item.recipeId,
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
      });
      await salesItem.save({ session });

      // Reduce stock using FIFO
      await reduceStockFIFO(item.recipeId, item.quantity, sales._id, salesItem._id, session);
    }

    await session.commitTransaction();
    session.endSession();

    return { sales, items: validatedItems.length };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ============================================
// Get All Sales
// ============================================

export const getAllSales = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const sales = await salesModel.find()
    .sort({ salesDate: -1 })
    .skip(skip)
    .limit(limit)
    .populate("processedBy", "staff.name staff.email ");
  const total = await salesModel.countDocuments();
  return { sales, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ============================================
// Get Sales by Date Range
// ============================================

export const getSalesByDateRange = async (fromDate, toDate) => {
  return await salesModel.find({
    salesDate: { $gte: new Date(fromDate), $lte: new Date(toDate) }
  }).sort({ salesDate: -1 }).populate("processedBy", "staff.name staff.email");
};

// ============================================
// Get Sales Details
// ============================================

export const getSalesDetails = async (salesId) => {
  const sales = await salesModel.findById(salesId).populate("processedBy", "staff.name staff.email");
  if (!sales) throw new Error("Sales record not found");
  const items = await salesItemModel.find({ salesId })
    .populate("recipeId", "recipeName recipeImage sellingPrice recipeCost");
  return { sales, items };
};

// ============================================
// Get Sales Summary
// ============================================

export const getSalesSummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todaySales, weekSales, monthSales, topProducts] = await Promise.all([
    salesModel.aggregate([
      { $match: { salesDate: { $gte: today } } },
      { $group: { _id: null, revenue: { $sum: "$totalNetRevenue" }, profit: { $sum: "$totalProfit" }, items: { $sum: "$totalItems" } } }
    ]),
    salesModel.aggregate([
      { $match: { salesDate: { $gte: startOfWeek } } },
      { $group: { _id: null, revenue: { $sum: "$totalNetRevenue" }, profit: { $sum: "$totalProfit" } } }
    ]),
    salesModel.aggregate([
      { $match: { salesDate: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: "$totalNetRevenue" }, profit: { $sum: "$totalProfit" } } }
    ]),
    salesItemModel.aggregate([
      { $group: { _id: "$recipeId", quantity: { $sum: "$quantity" }, revenue: { $sum: "$grossRevenue" } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      { $lookup: { from: "recipes", localField: "_id", foreignField: "_id", as: "recipe" } },
      { $unwind: "$recipe" },
      { $project: { recipeName: "$recipe.recipeName", totalQuantity: "$quantity", totalRevenue: "$revenue" } }
    ])
  ]);

  return {
    today: { revenue: todaySales[0]?.revenue || 0, profit: todaySales[0]?.profit || 0, items: todaySales[0]?.items || 0 },
    week: { revenue: weekSales[0]?.revenue || 0, profit: weekSales[0]?.profit || 0 },
    month: { revenue: monthSales[0]?.revenue || 0, profit: monthSales[0]?.profit || 0 },
    topProducts: topProducts || []
  };
};