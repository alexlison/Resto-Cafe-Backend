import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { toggleManagerStatus, toggleStaffStatus, viewAllManagers, viewAllStaff } from "../controllers/admin.controllers.js";

const router = express.Router();

// middleware
router.use(authenticate);
router.use(isAdmin);

//routes

// views
router.get("/viewAllStaff",viewAllStaff);
router.get("/viewAllManagers",viewAllManagers);


// toggle status
router.patch("/toggleStaffStatus/:id", toggleStaffStatus);
router.patch("/toggleManagerStatus/:id", toggleManagerStatus);



export default router;
