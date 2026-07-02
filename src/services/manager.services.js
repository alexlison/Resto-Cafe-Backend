import users from "../models/users.model.js";
import bcrypt from "bcryptjs";

// Update Manager Profile
export const updateManagerService = async (managerId, updateData) => {
  const { name, email, phone, dob, gender } = updateData;

  // Find manager by ID
  const manager = await users.findById(managerId);

  if (!manager) {
    throw new Error("Manager not found");
  }

  // Check if role is manager
  if (manager.role !== 'manager' && manager.role !== 'admin') {
    throw new Error("User is not a manager");
  }

  // Check if email already exists for another user
  if (email && email !== manager.manager.email) {
    const existingEmail = await users.findOne({
      "manager.email": email,
      _id: { $ne: managerId }
    });

    if (existingEmail) {
      throw new Error("Email already exists");
    }
  }

  // Check if phone already exists for another user
  if (phone && phone !== manager.manager.phone) {
    const existingPhone = await users.findOne({
      "manager.phone": phone,
      _id: { $ne: managerId }
    });

    if (existingPhone) {
      throw new Error("Phone number already exists");
    }
  }

  // Update manager data
  const updatedManager = await users.findByIdAndUpdate(
    managerId,
    {
      $set: {
        "manager.name": name,
        "manager.email": email,
        "manager.phone": phone,
        "manager.dob": dob,
        "manager.gender": gender,
        // Also update top-level fields for easy access
        name: name,
        email: email,
        phone: phone,
        dob: dob,
        gender: gender
      }
    },
    {
      new: true,
      runValidators: true
    }
  );

  return updatedManager;
};

// Get Manager by ID
export const getManagerByIdService = async (managerId) => {
  const manager = await users.findById(managerId);

  if (!manager) {
    return null;
  }

  // Check if user is a manager
  if (manager.role !== 'manager' && manager.role !== 'admin') {
    return null;
  }

  // Return manager data (excluding password)
  return {
    _id: manager._id,
    role: manager.role,
    isActive: manager.isActive,
    joiningDate: manager.joiningDate,
    manager: {
      name: manager.manager.name,
      email: manager.manager.email,
      phone: manager.manager.phone,
      dob: manager.manager.dob,
      gender: manager.manager.gender
    },
    name: manager.name || manager.manager.name,
    email: manager.email || manager.manager.email,
    phone: manager.phone || manager.manager.phone,
    dob: manager.dob || manager.manager.dob,
    gender: manager.gender || manager.manager.gender,
    createdAt: manager.createdAt,
    updatedAt: manager.updatedAt
  };
};

// Get all managers (for admin view)
export const getAllManagersService = async () => {
  const managers = await users.find({
    role: "manager"
  }).select("-manager.password -password");

  return managers;
};

// Update manager password (optional)
export const updateManagerPasswordService = async (managerId, oldPassword, newPassword) => {
  const manager = await users.findById(managerId);

  if (!manager) {
    throw new Error("Manager not found");
  }

  // Check if user is a manager
  if (manager.role !== 'manager' && manager.role !== 'admin') {
    throw new Error("User is not a manager");
  }

  // Verify old password
  const isPasswordValid = await bcrypt.compare(oldPassword, manager.manager.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  const updatedManager = await users.findByIdAndUpdate(
    managerId,
    {
      $set: {
        "manager.password": hashedPassword
      }
    },
    {
      new: true
    }
  );

  return updatedManager;
};