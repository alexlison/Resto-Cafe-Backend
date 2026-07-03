import {
  updateStaffService,
  getStaffService
} from "../services/staff.services.js";

// Update Staff Profile (with optional password)
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const staff = await updateStaffService(id, data);

    res.status(200).json({
      status: "SUCCESS",
      message: "Staff updated successfully",
      data: staff
    });

  } catch (error) {
    const status = error.message === "Staff not found" ? 404 :
                  error.message === "Email already exists" ? 409 :
                  error.message === "Phone number already exists" ? 409 :
                  error.message === "Current password is incorrect" ? 401 : 500;

    res.status(status).json({
      status: "FAILED",
      message: error.message
    });
  }
};

// Get Staff Profile
export const getStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await getStaffService(id);

    res.status(200).json({
      status: "SUCCESS",
      message: "Staff profile retrieved",
      data: staff
    });

  } catch (error) {
    const status = error.message === "Staff not found" ? 404 : 500;
    res.status(status).json({
      status: "FAILED",
      message: error.message
    });
  }
};


