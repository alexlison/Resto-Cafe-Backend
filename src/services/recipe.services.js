// recipe.services.js

import recipes from "../models/recipe.model.js";
import ingredients from "../models/ingredient.model.js";


// ADD RECIPE

export const addRecipeService = async (data, imageUrl = null) => {

    const {
        recipeName,
        recipeItems,
        recipeCost,
        sellingPrice
    } = data;

    const existingRecipe = await recipes.findOne({ recipeName });

    if (existingRecipe) {
        throw new Error("Recipe already exists");
    }

    for (const item of recipeItems) {
        const ingredient = await ingredients.findById(item.ingredientId);
        if (!ingredient) {
            throw new Error("Ingredient not found");
        }
    }

    // IMPORTANT: Convert to numbers before comparing
    const cost = Number(recipeCost);
    const price = Number(sellingPrice);

    if (price <= cost) {
        throw new Error("Selling price must be greater than recipe cost");
    }

    if (imageUrl) {
        data.recipeImage = imageUrl;
    }

    const recipe = await recipes.create(data);
    return recipe;
};

// EDIT RECIPE

export const editRecipeService = async (id, data, imageUrl = null) => {

    const currentRecipe = await recipes.findById(id);

    if (!currentRecipe) {
        throw new Error("Recipe not found");
    }

    // Recipe name duplicate check
    if (data.recipeName && data.recipeName !== currentRecipe.recipeName) {
        const existingRecipe = await recipes.findOne({
            recipeName: data.recipeName
        });
        if (existingRecipe) {
            throw new Error("Recipe name already exists");
        }
    }

    // Validate ingredients only if recipeItems exists
    if (data.recipeItems) {
        for (const item of data.recipeItems) {
            const ingredient = await ingredients.findById(item.ingredientId);
            if (!ingredient) {
                throw new Error("Ingredient not found");
            }
        }
    }

    // Price validation - Convert to numbers
    if (data.sellingPrice && data.recipeCost) {
        const cost = Number(data.recipeCost);
        const price = Number(data.sellingPrice);
        
        if (price <= cost) {
            throw new Error("Selling price must be greater than recipe cost");
        }
    }

    // Update image only
    if (imageUrl) {
        data.recipeImage = imageUrl;
    }

    const updatedRecipe = await recipes.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
    );

    return updatedRecipe;
};

// VIEW ALL RECIPE

export const getAllRecipeService = async () => {

    const recipeList =
        await recipes.find();

    return recipeList;

};


// TOGGLE RECIPE STATUS
export const toggleRecipeStatusService = async (id) => {

    const recipe =
        await recipes.findById(
            id
        );

    if (!recipe) {

        throw new Error(
            "Recipe not found"
        );

    }

    recipe.isActive =
        !recipe.isActive;

    await recipe.save();

    return recipe;

};