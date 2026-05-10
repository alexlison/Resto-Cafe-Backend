import { registerStaffService } from "../services/auth.services.js";

export const registerStaff = async(req,res) => {

    try {

        const InputData = req.body;

        const staff = await registerStaffService(InputData);

        return res.status(201).json({
            status: "Success",
            message: "Staff Registered Succefully",
            data: staff
        });
        
    } catch (error) {

        return res.status(401).json({
            status: "Error",
            message: error.message || "Error in Registration",
            
        });
        
    }
}

