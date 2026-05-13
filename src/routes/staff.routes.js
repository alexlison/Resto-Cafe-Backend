import express from "express";
import { isStaff } from "../middlewares/staff.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { addCategory, editCategory, toggleCategoryStatus, viewAllCategory } from "../controllers/category.controllers.js";

const router = express.Router();

// Middlewares
router.use(authenticate);
router.use(isStaff);

// Routes

// Category Routes
router.post("/addCategory",addCategory);
router.put("/editCategory/:id",editCategory);
router.get("/viewAllCategory",viewAllCategory);
router.patch("/toggleCategoryStatus/:id",toggleCategoryStatus);

export default router;
