import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("❌ Server startup failed:", error.message);
  process.exit(1);
}
