import { loginService, registerManagerService, registerStaffService } from "../services/auth.services.js";

// Staff Registration

export const registerStaff = async(req,res) => {

    try {

        const InputData = req.body;

        const staff = await registerStaffService(InputData);

        return res.status(201).json({
            status: "Success",
            message: "Staff Registered Successfully",
            data: staff
        });
        
    } catch (error) {

        return res.status(401).json({
            status: "Error",
            message: error.message || "Error in Registration",
            
        });
        
    }
}


// Manager Registration

export const registerManager = async(req,res) => {

    try {

        const InputData = req.body;

        const manager = await registerManagerService(InputData);

        return res.status(201).json({
            status: "Success",
            message: "Manager Registered Successfully",
            data: manager
        });
        
    } catch (error) {

        return res.status(401).json({
            status: "Error",
            message: error.message || "Error in Registration"
        });
        
    }
}

// Login

export const Login = async(req,res) => {

    try {

        const { email, password } = req.body;

        const result = await loginService(email,password);

        return res.status(200).json({
            status: "Success",
            message: "Login Successfull",
            user: result.user,
            token: result.token
        });
        
    } catch (error) {

        return res.status(error.statusCode || 400).json({
            Status: "Error",
            message: error.message || "Login failed"
        });
        
    }
}
