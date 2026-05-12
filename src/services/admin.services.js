
// Get All Staff Service
export const getAllStaff = async () => {

    const staffs = await User.find({
        role: "staff"
    }).select("-staff.password");

    return staffs;

};