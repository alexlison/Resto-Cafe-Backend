import express from "express"
import users from "../models/users.model.js"
import bcrypt from "bcryptjs";

export const registerStaffService = async(data) => {
    
    const {name,email,phone,password,dob,gender} = data;

    const existingEmail = await users.findOne({
        "staff.email": email
    });

    if(existingEmail){

        const error = new Error("Email Id Already Exists");
        error.StatusCode = 408;
        throw error;
    }

    const existingPhone = await users.findOne({
        "staff.phone": phone
    });

    if(existingPhone) {
        const error = new Error("Phone No Already Exists");
        error.StatusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const staff = await users.create({
        role: "staff",
        staff: {
            name,
            email,
            phone,
            password:hashedPassword,
            dob,
            gender
        }

    });

    return staff;

}