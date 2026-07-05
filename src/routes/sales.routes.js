import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { 
  previewSales,
  approveSales,
  viewAllSales, 
  getSalesByDateRange, 
  getSalesDetails, 
  getSalesSummary, 
  addManualSalesData
} from "../controllers/sales.controllers.js";
import uploadSalesPDFMiddleware from "../config/sales.multer.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Preview - only parses and returns data without saving
router.post("/preview", uploadSalesPDFMiddleware.single("pdf"), previewSales);

// Approve - processes and saves after confirmation
router.post("/approve", uploadSalesPDFMiddleware.single("pdf"), approveSales);

// Manual add - add sales data directly without PDF
router.post("/manual", addManualSalesData);

// View routes
router.get("/viewAll", viewAllSales);
router.get("/date-range", getSalesByDateRange);
router.get("/summary", getSalesSummary);
router.get("/details/:id", getSalesDetails);

export default router;