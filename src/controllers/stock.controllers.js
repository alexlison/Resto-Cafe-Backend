import { getStockDataService } from '../services/stock.services.js';

// Get Stock Data
export const getStockData = async (req, res) => {
  try {
    const result = await getStockDataService();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Stock data retrieved successfully",
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to retrieve stock data",
      data: null
    });
  }
};