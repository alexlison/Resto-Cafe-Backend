import express from "express";
import { isStaff } from "../middlewares/staff.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { addCategory, editCategory, toggleCategoryStatus, viewAllCategory } from "../controllers/category.controllers.js";
import { addSubCategory, editSubCategory, toggleSubCategoryStatus, viewAllSubCategory } from "../controllers/subcategory.controllers.js";
import { addVendor, editVendor, toggleVendorStatus, viewAllVendor } from "../controllers/vendor.controllers.js";
import { addBrand, editBrand, toggleBrandStatus, viewAllBrand } from "../controllers/brand.controllers.js";

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

// Subcategory Routes
router.post("/addSubCategory",addSubCategory);
router.put("/editSubCategory/:id",editSubCategory);
router.get("/viewAllSubCategory",viewAllSubCategory);
router.patch("/toggleSubCategoryStatus/:id",toggleSubCategoryStatus);


// Vendor Routes
router.post("/addVendor",addVendor);
router.put("/editVendor/:id",editVendor);
router.get("/viewAllVendor",viewAllVendor);
router.patch("/toggleVendorStatus/:id",toggleVendorStatus);

// Brand Routes
router.post("/addBrand",addBrand);
router.put("/editBrand/:id",editBrand);
router.get("/viewAllBrand",viewAllBrand);
router.patch("/toggleBrandStatus/:id",toggleBrandStatus);


export default router;
