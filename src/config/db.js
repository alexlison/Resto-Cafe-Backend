import mongoose from "mongoose";

const connectDB = async () => {

    try {

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000
        });

        console.log("✅ MongoDB Connected");

    } catch (error) {

        console.error("❌ MongoDB connection failed:", error.message);

    }

};

export default connectDB;