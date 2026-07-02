import express from "express"
import cors from "cors"

import authRoutes from "./routes/auth.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import staffRoutes from "./routes/staff.routes.js"
import managerRoutes from "./routes/manager.routes.js"

const app = express();

app.use(cors());
app.use(express.json());


app.use("/ingredients", express.static("ingredients"));
app.use("/recipes", express.static("recipes"));


// Routes
app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/manager",managerRoutes);
app.use("/api/staff",staffRoutes);



export default app;