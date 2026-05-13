
import users from "../models/users.model.js"

// Get All Staff Service
export const getAllStaff = async () => {

    const staffs = await users.find({
        role: "staff"
    }).select("-staff.password");

    return staffs;

};

// Get All Managers Service
export const getAllManagers = async () => {

    const Managers = await users.find({
        role: "manager"
    }).select("-manager.password");

    return Managers;

};