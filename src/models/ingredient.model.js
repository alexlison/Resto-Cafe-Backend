import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({

    ingredientName: {
        type: String,
        required: true,
        trim: true
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        required: true
    },

    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subcategories",
        required: true
    },

    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "brands",
        required: true
    },

    unit: {
        type: String,
        enum: [
            "kg",
            "g",
            "ltr",
            "ml",
            "pcs"
        ],
        required: true
    },

    costPrice: {
        type: Number,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "ingredients",
    ingredientSchema
);