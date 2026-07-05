import mongoose from "mongoose";

const salesItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  pdfRate: {
    type: Number,
    required: true,
    default: 0
  },
  pdfTotal: {
    type: Number,
    required: true,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  saleAmount: {
    type: Number,
    default: 0
  },
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
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

salesItemSchema.index({ salesId: 1, recipeId: 1 });

export default mongoose.model("salesitems", salesItemSchema);