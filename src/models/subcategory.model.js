import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        required: true
    },

    subCategoryName: {
        type: String,
        required: true,
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
    "subcategories",
    subCategorySchema
);