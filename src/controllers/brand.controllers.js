// brand.controllers.js

import {

    addBrandService,
    editBrandService,
    getAllBrandService,
    toggleBrandStatusService

} from "../services/brand.services.js";

// Add Brand
export const addBrand = async (req, res) => {

    try {

        const result =
            await addBrandService(req.body);

        return res.status(201).json({
            status: "SUCCESS",
            message: "Brand added successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Edit Brand
export const editBrand = async (req, res) => {

    try {

        const result =
            await editBrandService(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Brand updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// View All Brand
export const viewAllBrand = async (req, res) => {

    try {

        const result =
            await getAllBrandService();

        return res.status(200).json({
            status: "SUCCESS",
            message:
                "Brand data retrieved successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Toggle Brand Status
export const toggleBrandStatus =
async (req, res) => {

    try {

        const result =
            await toggleBrandStatusService(
                req.params.id
            );

        return res.status(200).json({
            status: "SUCCESS",
            message:
                "Brand status updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};