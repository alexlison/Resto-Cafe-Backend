// vendor.controllers.js

import {

    addVendorService,
    editVendorService,
    getAllVendorService,
    toggleVendorStatusService

} from "../services/vendor.services.js";

// Add Vendor
export const addVendor = async (req, res) => {

    try {

        const result =
            await addVendorService(req.body);

        return res.status(201).json({
            status: "SUCCESS",
            message: "Vendor added successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Edit Vendor
export const editVendor = async (req, res) => {

    try {

        const result =
            await editVendorService(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            status: "SUCCESS",
            message: "Vendor updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// View All Vendor
export const viewAllVendor = async (req, res) => {

    try {

        const result =
            await getAllVendorService();

        return res.status(200).json({
            status: "SUCCESS",
            message:
                "Vendor data retrieved successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};

// Toggle Vendor Status
export const toggleVendorStatus =
async (req, res) => {

    try {

        const result =
            await toggleVendorStatusService(
                req.params.id
            );

        return res.status(200).json({
            status: "SUCCESS",
            message:
                "Vendor status updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message
        });

    }

};