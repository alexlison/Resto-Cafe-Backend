import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { isManager } from "../middlewares/manger.middleware.js";
import { viewAllStaff } from "../controllers/admin.controllers.js";
import { toggleCategoryStatus, viewAllCategory } from "../controllers/category.controllers.js";
import { toggleSubCategoryStatus, viewAllSubCategory } from "../controllers/subcategory.controllers.js";
import { toggleVendorStatus, viewAllVendor } from "../controllers/vendor.controllers.js";
import { toggleBrandStatus, viewAllBrand } from "../controllers/brand.controllers.js";
import { toggleIngredientStatus, viewAllIngredient } from "../controllers/ingredient.controllers.js";
import { toggleRecipeStatus, viewAllRecipe } from "../controllers/recipe.controllers.js";
import { viewAllPurchase } from "../controllers/purchase.controllers.js";
import { getStockData, updateBatchStatus } from "../controllers/stock.controllers.js";
import { getManagerProfile, updateManagerProfile } from "../controllers/manager.controllers.js";

const router = express.Router();

// middleware
router.use(authenticate);
router.use(isManager);

//routes

// views

// Manager Profile Routes
router.get("/profile/:id", getManagerProfile);
router.put("/updateProfile/:id", updateManagerProfile);

router.get("/viewAllStaff",viewAllStaff);

router.get("/viewAllCategory",viewAllCategory);
router.patch("/toggleCategoryStatus/:id",toggleCategoryStatus);

router.get("/viewAllSubCategory",viewAllSubCategory);
router.patch("/toggleSubCategoryStatus/:id",toggleSubCategoryStatus);

router.get("/viewAllVendor",viewAllVendor);
router.patch("/toggleVendorStatus/:id",toggleVendorStatus);

router.get("/viewAllBrand",viewAllBrand);
router.patch("/toggleBrandStatus/:id",toggleBrandStatus);

router.get("/viewAllIngredient",viewAllIngredient);
router.patch("/toggleIngredientStatus/:id",toggleIngredientStatus);

router.get("/viewAllRecipe",viewAllRecipe);
router.patch("/toggleRecipeStatus/:id",toggleRecipeStatus);

router.get("/viewAllPurchase",viewAllPurchase);
router.get("/viewStock", getStockData);
router.patch("/updateBatchStatus", updateBatchStatus); 



export default router;
