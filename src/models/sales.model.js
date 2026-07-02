import mongoose from "mongoose";

const salesSchema = new mongoose.Schema(
  {
    salesDate: {
      type: Date,
      required: true,
      unique: true,
      index: true
    },
    pdfFileName: {
      type: String,
      required: true
    },
    pdfFilePath: {
      type: String,
      required: true
    },
    totalGrossRevenue: {
      type: Number,
      required: true,
      default: 0
    },
    totalDiscount: {
      type: Number,
      required: true,
      default: 0
    },
    totalTax: {
      type: Number,
      required: true,
      default: 0
    },
    totalNetRevenue: {
      type: Number,
      required: true,
      default: 0
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0
    },
    totalProfit: {
      type: Number,
      required: true,
      default: 0
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);


export default mongoose.model("sales", salesSchema);