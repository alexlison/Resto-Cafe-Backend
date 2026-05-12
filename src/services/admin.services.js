
import users from "../models/users.model.js"

// Get All Staff Service
export const getAllStaff = async () => {

    const staffs = await users.find({
        role: "staff"
    }).select("-staff.password");

    return staffs;

};