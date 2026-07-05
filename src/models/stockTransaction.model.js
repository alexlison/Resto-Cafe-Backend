import mongoose from "mongoose";

const stockTransactionSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ingredients",
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "purchasebatches",
    required: true,
    index: true
  },
  salesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sales",
    required: true
  },
  salesItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "salesitems",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ["SALE", "RETURN", "ADJUSTMENT"],
    default: "SALE"
  },
  description: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

export default mongoose.model("stocktransactions", stockTransactionSchema);