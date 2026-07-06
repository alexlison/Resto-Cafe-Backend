
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



// Toggle Staff Status Service
export const toggleStaffStatusService = async (id) => {

    const staff = await users.findById(id);

    if (!staff) {
        throw new Error("Staff not found");
    }

    if (staff.role !== "staff") {
        throw new Error("User is not a staff member");
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    return staff;

};

// Toggle Manager Status Service
export const toggleManagerStatusService = async (id) => {

    const manager = await users.findById(id);

    if (!manager) {
        throw new Error("Manager not found");
    }

    if (manager.role !== "manager") {
        throw new Error("User is not a manager");
    }

    manager.isActive = !manager.isActive;
    await manager.save();

    return manager;

};