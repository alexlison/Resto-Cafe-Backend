import {
  processSalesPDF,
  getAllSales,
  getSalesByDateRange as getSalesByDateRangeService,
  getSalesDetails as getSalesDetailsService,
  getSalesSummary as getSalesSummaryService
} from "../services/sales.services.js";

/**
 * Upload and process sales PDF
 */
export const uploadSalesPDF = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        status: "FAILED",
        message: "No PDF file uploaded. Please upload a valid PDF file."
      });
    }

    // Check file type
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid file type. Only PDF files are allowed."
      });
    }

    // Get user ID from request (set by auth middleware)
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        status: "FAILED",
        message: "User not authenticated"
      });
    }

    // Process the sales PDF
    const result = await processSalesPDF(req.file, userId);

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
    console.error("Upload Sales PDF Error:", error.message);

    return res.status(400).json({
      status: "FAILED",
      message: error.message || "Failed to process sales PDF"
    });
  }
};

/**
 * Get all sales records (paginated)
 */
export const viewAllSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getAllSales(page, limit);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Sales data retrieved successfully",
      data: result
    });

  } catch (error) {
    console.error("View All Sales Error:", error.message);

    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to retrieve sales data"
    });
  }
};

/**
 * Get sales by date range
 */
export const getSalesByDateRange = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        status: "FAILED",
        message: "Both fromDate and toDate are required"
      });
    }

    // Validate date format
    if (isNaN(new Date(fromDate)) || isNaN(new Date(toDate))) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid date format. Please use YYYY-MM-DD"
      });
    }

    const sales = await getSalesByDateRangeService(fromDate, toDate);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Sales data retrieved successfully",
      data: sales
    });

  } catch (error) {
    console.error("Get Sales By Date Range Error:", error.message);

    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to retrieve sales data"
    });
  }
};

/**
 * Get sales details with items
 */
export const getSalesDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "FAILED",
        message: "Sales ID is required"
      });
    }

    const result = await getSalesDetailsService(id);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Sales details retrieved successfully",
      data: result
    });

  } catch (error) {
    console.error("Get Sales Details Error:", error.message);

    return res.status(404).json({
      status: "FAILED",
      message: error.message || "Failed to retrieve sales details"
    });
  }
};

/**
 * Get sales summary for dashboard
 */
export const getSalesSummary = async (req, res) => {
  try {
    const summary = await getSalesSummaryService();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Sales summary retrieved successfully",
      data: summary
    });

  } catch (error) {
    console.error("Get Sales Summary Error:", error.message);

    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to retrieve sales summary"
    });
  }
};