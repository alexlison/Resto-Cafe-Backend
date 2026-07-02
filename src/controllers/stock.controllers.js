import { getStockDataService, updateBatchStatuses } from '../services/stock.services.js';

// Update batch statuses
export const updateBatchStatus = async (req, res) => {
  try {
    const result = await updateBatchStatuses();

    return res.status(200).json({
      status: "SUCCESS",
      message: `Updated ${result.updatedCount} batches`,
      data: result
    });

  } catch (error) {
    console.error("Update Batch Status Error:", error.message);
    
    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to update batch statuses"
    });
  }
};

// Get Stock Data
export const getStockData = async (req, res) => {
  try {
    // Update batch statuses first
    await updateBatchStatuses();

    const result = await getStockDataService();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Stock data retrieved successfully",
      data: result
    });

  } catch (error) {
    console.error("Get Stock Data Error:", error.message);
    
    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to retrieve stock data",
      data: null
    });
  }
};