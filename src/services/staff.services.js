import users from "../models/users.model.js";
import bcrypt from "bcryptjs";

// Update Staff Profile
export const updateStaffService = async (id, data) => {
  const { name, email, phone, dob, gender, currentPassword, newPassword } = data;

  const staff = await users.findById(id);

  if (!staff) {
    throw new Error("Staff not found");
  }

  // Check duplicate email
  if (email && email !== staff.staff.email) {
    const existingEmail = await users.findOne({
      "staff.email": email,
      _id: { $ne: id }
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }
  }

  // Check duplicate phone
  if (phone && phone !== staff.staff.phone) {
    const existingPhone = await users.findOne({
      "staff.phone": phone,
      _id: { $ne: id }
    });
    if (existingPhone) {
      throw new Error("Phone number already exists");
    }
  }

  // Prepare update data
  const updateData = {
    "staff.name": name,
    "staff.email": email,
    "staff.phone": phone,
    "staff.dob": dob,
    "staff.gender": gender,
    name: name,
    email: email,
    phone: phone,
    dob: dob,
    gender: gender
  };

  // Handle password update
  if (currentPassword && newPassword) {
    const isValid = await bcrypt.compare(currentPassword, staff.staff.password);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }
    updateData["staff.password"] = await bcrypt.hash(newPassword, 10);
  }

  const updatedStaff = await users.findByIdAndUpdate(id, updateData, { new: true });

  // Remove password
  const staffData = updatedStaff.toObject();
  delete staffData.staff.password;

  return staffData;
};

// Get Staff Profile
export const getStaffService = async (id) => {
  const staff = await users.findById(id).select("-staff.password -password");
  if (!staff) {
    throw new Error("Staff not found");
  }
  return staff;
};

