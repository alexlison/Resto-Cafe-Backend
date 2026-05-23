import ingredients from "../models/ingredient.model.js";

import categories from "../models/category.model.js";
import subcategories from "../models/subcategory.model.js";
import brands from "../models/brand.model.js";


// Add Ingredient

export const addIngredientService =
    async (data, imageUrl = null) => {

        const {

            ingredientName,
            categoryId,
            subCategoryId,
            brandId

        } = data;


        // Category Validation
        const category =
            await categories.findById(
                categoryId
            );

        if (!category) {

            throw new Error(
                "Category not found"
            );

        }


        // Subcategory Validation
        if (subCategoryId) {

            const subCategory =
                await subcategories.findById(
                    subCategoryId
                );

            if (!subCategory) {

                throw new Error(
                    "Subcategory not found"
                );

            }


            if (

                subCategory
                    .categoryId
                    .toString()

                !==

                categoryId

            ) {

                throw new Error(

                    "Subcategory does not belong to selected category"

                );

            }

        }


        // Brand Validation
        const brand =
            await brands.findById(
                brandId
            );

        if (!brand) {

            throw new Error(
                "Brand not found"
            );

        }


        // Duplicate Validation
        const existingIngredient =
            await ingredients.findOne({

                ingredientName,

                categoryId,

                brandId,

                subCategoryId:
                    subCategoryId || null

            });

        if (existingIngredient) {

            throw new Error(
                "Ingredient already exists"
            );

        }


        // Add Image URL
        if (imageUrl) {

            data.ingredientImage =
                imageUrl;

        }


        const ingredient =
            await ingredients.create(
                data
            );

        return ingredient;

    };



// Edit Ingredient

export const editIngredientService =
    async (id, data, imageUrl = null) => {


        const {

            ingredientName,
            categoryId,
            subCategoryId,
            brandId

        } = data;


        // Category Validation
        if (categoryId) {

            const category =
                await categories.findById(
                    categoryId
                );

            if (!category) {

                throw new Error(
                    "Category not found"
                );

            }

        }


        // Subcategory Validation
        if (subCategoryId) {

            const subCategory =
                await subcategories.findById(
                    subCategoryId
                );

            if (!subCategory) {

                throw new Error(
                    "Subcategory not found"
                );

            }

            if (

                subCategory
                    .categoryId
                    .toString()

                !==

                categoryId

            ) {

                throw new Error(

                    "Subcategory does not belong to selected category"

                );

            }

        }


        // Brand Validation
        if (brandId) {

            const brand =
                await brands.findById(
                    brandId
                );

            if (!brand) {

                throw new Error(
                    "Brand not found"
                );

            }

        }


        // Duplicate Validation
        const existingIngredient =
            await ingredients.findOne({

                ingredientName,
                categoryId,
                brandId,

                subCategoryId:
                    subCategoryId || null,

                _id: {
                    $ne: id
                }

            });


        if (existingIngredient) {

            throw new Error(
                "Ingredient already exists"
            );

        }


        // Image Update
        if (imageUrl) {

            data.ingredientImage =
                imageUrl;

        }


        return await ingredients.findByIdAndUpdate(

            id,
            data,
            { new: true }

        );

    };


// View All
export const getAllIngredientService = async () => {

    return await ingredients.find();

};


// Toggle
export const toggleIngredientStatusService = async (id) => {

    const ingredient =
        await ingredients.findById(id);

    if (!ingredient) {

        throw new Error(
            "Ingredient not found"
        );

    }

    ingredient.isActive =
        !ingredient.isActive;

    await ingredient.save();

    return ingredient;

};