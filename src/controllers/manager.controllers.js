import users from "../models/users.model.js";
import bcrypt from "bcryptjs";

// Update Manager Profile with Password
export const updateManagerProfile = async (req, res) => {
  try {
    const managerId = req.params.id;
    const updateData = req.body;

    // Find manager
    const manager = await users.findById(managerId);

    if (!manager) {
      return res.status(404).json({
        status: "FAILED",
        message: "Manager not found"
      });
    }

    // Check if user is a manager
    if (manager.role !== 'manager' && manager.role !== 'admin') {
      return res.status(403).json({
        status: "FAILED",
        message: "User is not a manager"
      });
    }

    const { name, email, phone, dob, gender, currentPassword, newPassword } = updateData;

    // Validate required fields
    if (!name || !email || !phone || !dob || !gender) {
      return res.status(400).json({
        status: "FAILED",
        message: "All fields are required: name, email, phone, dob, gender"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please enter a valid email address"
      });
    }

    // Phone validation (Indian 10-digit)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Please enter a valid 10-digit phone number"
      });
    }

    // Gender validation
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Gender must be Male, Female, or Other"
      });
    }

    // Check if email already exists for another user
    if (email && email !== manager.manager.email) {
      const existingEmail = await users.findOne({
        "manager.email": email,
        _id: { $ne: managerId }
      });

      if (existingEmail) {
        return res.status(409).json({
          status: "FAILED",
          message: "Email already exists"
        });
      }
    }

    // Check if phone already exists for another user
    if (phone && phone !== manager.manager.phone) {
      const existingPhone = await users.findOne({
        "manager.phone": phone,
        _id: { $ne: managerId }
      });

      if (existingPhone) {
        return res.status(409).json({
          status: "FAILED",
          message: "Phone number already exists"
        });
      }
    }

    // Prepare update object
    const updateFields = {
      "manager.name": name,
      "manager.email": email,
      "manager.phone": phone,
      "manager.dob": dob,
      "manager.gender": gender,
      name: name,
      email: email,
      phone: phone,
      dob: dob,
      gender: gender
    };

    // Handle password update if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, manager.manager.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          status: "FAILED",
          message: "Current password is incorrect"
        });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({
          status: "FAILED",
          message: "New password must be at least 6 characters"
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields["manager.password"] = hashedPassword;
    }

    // Update manager
    const updatedManager = await users.findByIdAndUpdate(
      managerId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Remove password from response
    const managerResponse = updatedManager.toObject();
    if (managerResponse.manager) {
      delete managerResponse.manager.password;
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: currentPassword && newPassword ? "Profile and password updated successfully" : "Profile updated successfully",
      data: managerResponse
    });

  } catch (error) {
    console.error('Update manager error:', error);
    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to update manager profile"
    });
  }
};

// Get Manager Profile
export const getManagerProfile = async (req, res) => {
  try {
    const managerId = req.params.id;

    const manager = await users.findById(managerId).select("-manager.password -password");

    if (!manager) {
      return res.status(404).json({
        status: "FAILED",
        message: "Manager not found"
      });
    }

    if (manager.role !== 'manager' && manager.role !== 'admin') {
      return res.status(403).json({
        status: "FAILED",
        message: "User is not a manager"
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Manager profile retrieved successfully",
      data: manager
    });

  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: error.message || "Failed to retrieve manager profile"
    });
  }
};