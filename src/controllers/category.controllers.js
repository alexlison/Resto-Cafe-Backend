// category.controllers.js

import {
    addCategoryService,
    editCategoryService,
    getAllCategoryService,
    toggleCategoryStatusService
} from "../services/category.service.js";

// Add Category
export const addCategory = async (req, res) => {

    try {

        const result = await addCategoryService(
            req.body
        );

        return res.status(201).json({
            status: "SUCCESS",
            message: "Category added successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Edit Category
export const editCategory = async (req, res) => {

    try {

        const result = await editCategoryService(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Category updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// View All Category
export const viewAllCategory = async (req, res) => {

    try {

        const result = await getAllCategoryService();

        return res.status(200).json({
            status: "SUCCESS",
            message: "Category data retrieved successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Toggle Category Status
export const toggleCategoryStatus = async (req, res) => {

    try {

        const result =
            await toggleCategoryStatusService(
                req.params.id
            );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Category status updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};