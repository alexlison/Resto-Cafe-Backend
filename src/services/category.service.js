// category.services.js

import categories from "../models/category.model.js";

// Add Category
export const addCategoryService = async (data) => {

    const { categoryName, description } = data;

    const existingCategory = await categories.findOne({ categoryName });

    if (existingCategory) {
        throw new Error(
            "Category already exists"
        );
    }

    const newCategory =
        await categories.create({

            categoryName,
            description

        });

    return newCategory;

};

// Edit Category
export const editCategoryService = async (id, data) => {

    const {
        categoryName
    } = data;

    // Check duplicate category name
    const existingCategory =
        await categories.findOne({
            categoryName,
            _id: { $ne: id }
        });

    if (existingCategory) {

        throw new Error(
            "Category name already exists"
        );

    }

    // Update category
    const updatedCategory =
        await categories.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );

    return updatedCategory;

};
// View All Category
export const getAllCategoryService =
async () => {

    const category =
        await categories.find();

    return category;

};

// Toggle Category Status
export const toggleCategoryStatusService = async (id) => {

    const category = await categories.findById(id);

    if (!category) {
        throw new Error(
            "Category not found"
        );
    }

    category.isActive =
        !category.isActive;

    await category.save();

    return category;

};