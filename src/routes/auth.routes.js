import express from "express"
import {registerManager, registerStaff} from "../controllers/auth.controllers.js"

const router = express.Router();

router.post("/registerStaff",registerStaff);
router.post("/registerManager",registerManager);

export default router;
