import mongoose from "mongoose";

const purchaseBatchSchema = new mongoose.Schema(
{
    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "purchases",
        required: true
    },

    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ingredients",
        required: true
    },

    batchNumber: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    unitCost: {
        type: Number,
        required: true
    },

    totalCost: {
        type: Number,
        required: true
    },

    manufacturingDate: {
        type: Date
    },

    expiryDate: {
        type: Date
    },

    remainingQuantity: {
        type: Number,
        required: true
    },
    batchStatus:{
    type:String,
    enum:[
        "ACTIVE",
        "EMPTY",
        "EXPIRED"
    ],
    default:"ACTIVE"
}

},
{
    timestamps: true
}
);

export default mongoose.model(
    "purchasebatches",
    purchaseBatchSchema
);