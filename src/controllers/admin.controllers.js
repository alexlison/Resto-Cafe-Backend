import { getAllManagers, getAllStaff ,toggleStaffStatusService, toggleManagerStatusService  } from "../services/admin.services.js";

// View All Staff 
export const viewAllStaff = async (req, res) => {

    try {

        const result = await getAllStaff();

        return res.status(200).json({
            status: "SUCCESS",
            message: "Staff data retrieved successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message || "Failed to retrieve staff data",
            data: null
        });

    }

};

// View All Manager
export const viewAllManagers = async (req, res) => {

    try {

        const result = await getAllManagers();

        return res.status(200).json({
            status: "SUCCESS",
            message: "Managers data retrieved successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message || "Failed to retrieve Managers data",
            data: null
        });

    }

};

// Toggle Staff Status
export const toggleStaffStatus = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                status: "FAILED",
                message: "Staff ID is required"
            });
        }

        const result = await toggleStaffStatusService(id);

        return res.status(200).json({
            status: "SUCCESS",
            message: "Staff status updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message || "Failed to toggle staff status",
            data: null
        });

    }

};

// Toggle Manager Status
export const toggleManagerStatus = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                status: "FAILED",
                message: "Manager ID is required"
            });
        }

        const result = await toggleManagerStatusService(id);

        return res.status(200).json({
            status: "SUCCESS",
            message: "Manager status updated successfully",
            data: result
        });

    } catch (error) {

        return res.status(500).json({
            status: "FAILED",
            message: error.message || "Failed to toggle manager status",
            data: null
        });

    }

};
