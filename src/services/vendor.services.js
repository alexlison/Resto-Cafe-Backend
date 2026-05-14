// vendor.services.js

import vendors
from "../models/vendor.model.js";

// Add Vendor
export const addVendorService =
async (data) => {

    const {
        vendorName,
        phone,
        email
    } = data;

    // Duplicate check
    const existingVendor =
        await vendors.findOne({

            $or: [
                { phone },
                { email }
            ]

        });

    if (existingVendor) {

        throw new Error(
            "Vendor already exists"
        );

    }

    const newVendor =
        await vendors.create(data);

    return newVendor;

};

// Edit Vendor
export const editVendorService =
async (id, data) => {

    const {
        phone,
        email
    } = data;

    // Duplicate check
    const existingVendor =
        await vendors.findOne({

            _id: { $ne: id },

            $or: [
                { phone },
                { email }
            ]

        });

    if (existingVendor) {

        throw new Error(
            "Phone or email already exists"
        );

    }

    const updatedVendor =
        await vendors.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );

    return updatedVendor;

};

// View All Vendor
export const getAllVendorService =
async () => {

    const vendorList =
        await vendors.find();

    return vendorList;

};

// Toggle Vendor Status
export const toggleVendorStatusService =
async (id) => {

    const vendor =
        await vendors.findById(id);

    if (!vendor) {

        throw new Error(
            "Vendor not found"
        );

    }

    vendor.isActive =
        !vendor.isActive;

    await vendor.save();

    return vendor;

};