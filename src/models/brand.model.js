import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({

    brandName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    description: {
        type: String
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "brands",
    brandSchema
);