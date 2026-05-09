import mongoose from "mongoose";
import dns from 'dns';

// Force IPv4 and Google DNS
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,  
      heartbeatFrequencyMS: 5000 
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;