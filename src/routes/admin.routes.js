import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { viewAllManagers, viewAllStaff } from "../controllers/admin.controllers.js";

const router = express.Router();

// middleware
router.use(authenticate);
router.use(isAdmin);

//routes

// view All Staff
router.get("/viewAllStaff",viewAllStaff);
router.get("/viewAllManagers",viewAllManagers);

export default router;
