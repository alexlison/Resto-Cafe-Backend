import express from "express"
import {Login, registerManager, registerStaff} from "../controllers/auth.controllers.js"

const router = express.Router();


// Registration
router.post("/registerStaff",registerStaff);
router.post("/registerManager",registerManager);

// login
router.post("/login",Login);

export default router;
