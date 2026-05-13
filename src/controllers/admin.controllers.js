import { getAllManagers, getAllStaff } from "../services/admin.services.js";

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
