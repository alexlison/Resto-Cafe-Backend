import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({

    recipeName: {
        type: String,
        required: true,
        trim: true
    },

    recipeItems: [

        {
            ingredientId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ingredients",
                required: true
            },

            quantity: {
                type: Number,
                required: true
            },
                unit: {
                type: String,
                enum: ["g", "ml", "pcs","ltr","kg"],
                required: true
            }

        }

    ],

    recipeCost: {
        type: Number,
        required: true
    },

    profitPercentage: {
        type: Number,
        required: true
    },

    sellingPrice: {
        type: Number,
        required: true
    },

    recipeImage: {
    type: String

    },

    isActive: {
        type: Boolean,
        default: true
    }

},
{
    timestamps:true
});

export default mongoose.model("recipes",recipeSchema);