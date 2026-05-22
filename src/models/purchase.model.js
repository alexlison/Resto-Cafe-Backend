import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
{
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "vendors",
        required: true
    },

    purchaseDate: {
        type: Date,
        default: Date.now
    },

    totalAmount: {
        type: Number,
        required: true
    },

},
{
    timestamps:true
}
);

export default mongoose.model(
    "purchases",
    purchaseSchema
);