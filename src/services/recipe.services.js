// recipe.services.js

import recipes from "../models/recipe.model.js";
import ingredients from "../models/ingredient.model.js";


// ADD RECIPE
export const addRecipeService = async (data) => {

    const {
        recipeName,
        recipeItems,
        recipeCost,
        sellingPrice
    } = data;

    // Duplicate recipe check
    const existingRecipe =
        await recipes.findOne({
            recipeName
        });

    if (existingRecipe) {

        throw new Error(
            "Recipe already exists"
        );

    }

    // Validate ingredients
    for (const item of recipeItems) {

        const ingredient =
            await ingredients.findById(
                item.ingredientId
            );

        if (!ingredient) {

            throw new Error(
                "Ingredient not found"
            );

        }

    }

    // Validate price
    if (
        sellingPrice <
        recipeCost
    ) {

        throw new Error(
            "Selling price cannot be less than recipe cost"
        );

    }

    const recipe =
        await recipes.create(
            data
        );

    return recipe;

};


// EDIT RECIPE

export const editRecipeService =
async (id, data) => {

    // Recipe exists check
    const currentRecipe =
        await recipes.findById(id);

    if (!currentRecipe) {

        throw new Error(
            "Recipe not found"
        );

    }

    // Check duplicate only if name changed
    if (
        data.recipeName &&
        data.recipeName !==
        currentRecipe.recipeName
    ) {

        const existingRecipe =
            await recipes.findOne({

                recipeName:
                    data.recipeName

            });

        if (existingRecipe) {

            throw new Error(
                "Recipe name already exists"
            );

        }

    }


    // Validate ingredients
    for (const item of data.recipeItems) {

        const ingredient =
            await ingredients.findById(
                item.ingredientId
            );

        if (!ingredient) {

            throw new Error(
                "Ingredient not found"
            );

        }

    }


    // Validate selling price
    if (
        data.sellingPrice <
        data.recipeCost
    ) {

        throw new Error(
            "Selling price cannot be less than recipe cost"
        );

    }


    const updatedRecipe =
        await recipes.findByIdAndUpdate(

            id,
            data,
            { new: true }

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