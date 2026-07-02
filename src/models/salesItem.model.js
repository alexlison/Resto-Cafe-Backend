import mongoose from "mongoose";

const salesItemSchema = new mongoose.Schema(
  {
    salesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sales",
      required: true,
      index: true
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "recipes",
      required: true
    },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ingredients",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    // From PDF
    pdfRate: {
      type: Number,
      required: true,
      min: 0
    },
    pdfTotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0
    },
    saleAmount: {
      type: Number,
      required: true,
      default: 0
    },
    // Calculated fields
    grossRevenue: {
      type: Number,
      required: true,
      default: 0
    },
    netRevenue: {
      type: Number,
      required: true,
      default: 0
    },
    costAmount: {
      type: Number,
      required: true,
      default: 0
    },
    profit: {
      type: Number,
      required: true,
      default: 0
    },
    pdfItemName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

salesItemSchema.index({ salesId: 1 });
salesItemSchema.index({ recipeId: 1 });
salesItemSchema.index({ ingredientId: 1 });

export default mongoose.model("salesitems", salesItemSchema);