import {
  previewSalesPDF,
  approveSalesPDF,
  getAllSales,
  getSalesByDateRange as getSalesByDateRangeService,
  getSalesDetails as getSalesDetailsService,
  getSalesSummary as getSalesSummaryService,
  addManualSales
} from "../services/sales.services.js";

/**
 * Preview sales PDF without saving
 */
export const previewSales = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "FAILED", message: "No PDF file uploaded" });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ status: "FAILED", message: "Only PDF files are allowed" });
    }

    const result = await previewSalesPDF(req.file);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Sales preview generated",
      data: result
    });
  } catch (error) {
    console.error("Preview Sales Error:", error.message);
    return res.status(400).json({ status: "FAILED", message: error.message });
  }
};

/**
 * Approve and process sales PDF
 */
export const approveSales = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "FAILED", message: "No PDF file found" });
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "FAILED", message: "User not authenticated" });
    }

    const { manualItems } = req.body;
    let parsedManualItems = [];

    if (manualItems) {
      try {
        parsedManualItems = typeof manualItems === 'string' 
          ? JSON.parse(manualItems) 
          : manualItems;
      } catch (e) {
        return res.status(400).json({ status: "FAILED", message: "Invalid manualItems format" });
      }
    }

    const result = await approveSalesPDF(req.file, userId, parsedManualItems);

    return res.status(201).json({
      status: "SUCCESS",
      message: "Sales data processed successfully",
      data: {
        salesId: result.sales._id,
        salesDate: result.sales.salesDate,
        totalItems: result.items,
        totalGrossRevenue: result.sales.totalGrossRevenue,
        totalNetRevenue: result.sales.totalNetRevenue,
        totalProfit: result.sales.totalProfit,
        pdfFileName: result.sales.pdfFileName
      }
    });
  } catch (error) {
    console.error("Approve Sales Error:", error.message);
    return res.status(400).json({ status: "FAILED", message: error.message });
  }
};

/**
 * Add manual sales data without PDF
 */
export const addManualSalesData = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: "FAILED", message: "User not authenticated" });
    }

    const { salesDate, items } = req.body;

    // Validate input
    if (!salesDate) {
      return res.status(400).json({ status: "FAILED", message: "salesDate is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: "FAILED", message: "At least one item is required" });
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemName || !item.quantity || !item.rate) {
        return res.status(400).json({ 
          status: "FAILED", 
          message: "Each item must have itemName, quantity, and rate" 
        });
      }
    }

    const result = await addManualSales(salesDate, items, userId);

    return res.status(201).json({
      status: "SUCCESS",
      message: "Sales data added successfully",
      data: {
        salesId: result.sales._id,
        salesDate: result.sales.salesDate,
        totalItems: result.items,
        totalGrossRevenue: result.sales.totalGrossRevenue,
        totalNetRevenue: result.sales.totalNetRevenue,
        totalProfit: result.sales.totalProfit
      }
    });
  } catch (error) {
    console.error("Add Manual Sales Error:", error.message);
    return res.status(400).json({ status: "FAILED", message: error.message });
  }
};

/**
 * View all sales
 */
export const viewAllSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getAllSales(page, limit);
    return res.status(200).json({ status: "SUCCESS", message: "Sales data retrieved", data: result });
  } catch (error) {
    console.error("View All Sales Error:", error.message);
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
};

/**
 * Get sales by date range
 */
export const getSalesByDateRange = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    if (!fromDate || !toDate) {
      return res.status(400).json({ status: "FAILED", message: "fromDate and toDate are required" });
    }
    const sales = await getSalesByDateRangeService(fromDate, toDate);
    return res.status(200).json({ status: "SUCCESS", message: "Sales data retrieved", data: sales });
  } catch (error) {
    console.error("Get Sales By Date Range Error:", error.message);
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
};

/**
 * Get sales details
 */
export const getSalesDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ status: "FAILED", message: "Sales ID is required" });
    }
    const result = await getSalesDetailsService(id);
    return res.status(200).json({ status: "SUCCESS", message: "Sales details retrieved", data: result });
  } catch (error) {
    console.error("Get Sales Details Error:", error.message);
    return res.status(404).json({ status: "FAILED", message: error.message });
  }
};

/**
 * Get sales summary
 */
export const getSalesSummary = async (req, res) => {
  try {
    const summary = await getSalesSummaryService();
    return res.status(200).json({ status: "SUCCESS", message: "Sales summary retrieved", data: summary });
  } catch (error) {
    console.error("Get Sales Summary Error:", error.message);
    return res.status(500).json({ status: "FAILED", message: error.message });
  }
};