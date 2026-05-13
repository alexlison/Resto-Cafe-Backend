import mongoose from "mongoose";

export const categorySchema = new mongoose.Schema({

    categoryName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    description: {
        type: String,

    },

    isActive: {
        type: Boolean,
        default: true
    }
}, 
   {
    timestamps: true

});

export default mongoose.model("categories",categorySchema);