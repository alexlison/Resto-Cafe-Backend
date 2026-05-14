// subcategory.services.js

import subcategories from "../models/subcategory.model.js";
import categories from "../models/category.model.js";

// Add Subcategory
export const addSubCategoryService = async (data) => {

    const {
        categoryId,
        subCategoryName,
        description
    } = data;

    // Check category exists
    const category = await categories.findById(categoryId);

    if (!category) {

        throw new Error("Category not found");

    }

    // Duplicate check
    const existingSubCategory = await subcategories.findOne({
            subCategoryName,
            categoryId
        });

    if (existingSubCategory) {

        throw new Error(
            "Subcategory already exists"
        );

    }

    const newSubCategory =
        await subcategories.create({

            categoryId,
            subCategoryName,
            description

        });

    return newSubCategory;

};

// Edit Subcategory
export const editSubCategoryService =
async (id, data) => {

    const {
        categoryId,
        subCategoryName
    } = data;

    // Duplicate check
    const existingSubCategory = await subcategories.findOne({
            subCategoryName,
            categoryId,
            _id: { $ne: id }

        });

    if (existingSubCategory) {

        throw new Error( "Subcategory already exists");

    }

    const updatedSubCategory =
        await subcategories.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );

    return updatedSubCategory;

};

// View All Subcategory
export const getAllSubCategoryService = async () => {

    const subCategoryList = await subcategories.find()
    .populate("categoryId");

    return subCategoryList;

};

// Toggle Subcategory Status
export const toggleSubCategoryStatusService = async (id) => {

    const subCategory = await subcategories.findById(id);

    if (!subCategory) {

        throw new Error("Subcategory not found");

    }

    subCategory.isActive = !subCategory.isActive;

    await subCategory.save();

    return subCategory;

};