// subcategory.controllers.js

import {

    addSubCategoryService,
    editSubCategoryService,
    getAllSubCategoryService,
    toggleSubCategoryStatusService

} from "../services/subcategory.services.js";

// Add SubCategory
export const addSubCategory = async (req, res) => {

    try {

        const result = await addSubCategoryService(req.body);

        return res.status(201).json({
            status: "SUCCESS",
            message: "Subcategory added successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Edit SubCategory
export const editSubCategory = async (req, res) => {

    try {

        const result = await editSubCategoryService(req.params.id,req.body);

        return res.status(200).json({
            status: "SUCCESS",
            message: "Subcategory updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// View All Subcategory
export const viewAllSubCategory =
async (req, res) => {

    try {

        const result =
            await getAllSubCategoryService();

        return res.status(200).json({
            status: "SUCCESS",
            message: "Subcategory data retrieved successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Toggle Subcategory Status
export const toggleSubCategoryStatus =
async (req, res) => {

    try {

        const result =
            await toggleSubCategoryStatusService(
                req.params.id
            );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Subcategory status updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};