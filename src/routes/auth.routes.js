import express from "express"
import {registerStaff} from "../controllers/auth.controllers.js"

const router = express.Router();

router.post("/registerStaff",registerStaff);

export default router;
