import express from "express"
import cors from "cors"

import authRoutes from "./routes/auth.routes.js"
import adminRoutes from "./routes/admin.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);


export default app;