import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { isManager } from "../middlewares/manger.middleware.js";
import { viewAllStaff } from "../controllers/admin.controllers.js";
import { viewAllCategory } from "../controllers/category.controllers.js";
import { viewAllSubCategory } from "../controllers/subcategory.controllers.js";
import { viewAllVendor } from "../controllers/vendor.controllers.js";
import { viewAllBrand } from "../controllers/brand.controllers.js";
import { viewAllIngredient } from "../controllers/ingredient.controllers.js";
import { viewAllRecipe } from "../controllers/recipe.controllers.js";
import { viewAllPurchase } from "../controllers/purchase.controllers.js";
import { getStockData } from "../controllers/stock.controllers.js";

const router = express.Router();

// middleware
router.use(authenticate);
router.use(isManager);

//routes

// views
router.get("/viewAllStaff",viewAllStaff);
router.get("/viewAllCategory",viewAllCategory);
router.get("/viewAllSubCategory",viewAllSubCategory);
router.get("/viewAllVendor",viewAllVendor);
router.get("/viewAllBrand",viewAllBrand);
router.get("/viewAllIngredient",viewAllIngredient);
router.get("/viewAllRecipe",viewAllRecipe);
router.get("/viewAllPurchase",viewAllPurchase);
router.get("/viewStock", getStockData);



export default router;
