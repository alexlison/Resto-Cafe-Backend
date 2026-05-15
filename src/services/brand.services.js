// brand.services.js

import brands from "../models/brand.model.js";

// Add Brand
export const addBrandService = async (data) => {

    const {
        brandName
    } = data;

    // Duplicate check
    const existingBrand =
        await brands.findOne({
            brandName
        });

    if (existingBrand) {

        throw new Error(
            "Brand already exists"
        );

    }

    const newBrand =
        await brands.create(data);

    return newBrand;

};

// Edit Brand
export const editBrandService = async (id, data) => {

    const {
        brandName
    } = data;

    // Duplicate check
    const existingBrand =
        await brands.findOne({

            brandName,

            _id: { $ne: id }

        });

    if (existingBrand) {

        throw new Error(
            "Brand already exists"
        );

    }

    const updatedBrand =
        await brands.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );

    return updatedBrand;

};

// View All Brand
export const getAllBrandService = async () => {

    const brandList =
        await brands.find();

    return brandList;

};

// Toggle Brand Status
export const toggleBrandStatusService = async (id) => {

    const brand =
        await brands.findById(id);

    if (!brand) {

        throw new Error(
            "Brand not found"
        );

    }

    brand.isActive =
        !brand.isActive;

    await brand.save();

    return brand;

};