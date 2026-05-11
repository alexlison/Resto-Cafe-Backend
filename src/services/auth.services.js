import express from "express"
import users from "../models/users.model.js"
import bcrypt from "bcryptjs";

// Staff Register Service

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

// Manager Registration Service

export const registerManagerService = async(data) => {

    const {name,email,phone,password,dob,gender} = data;
    
    const EmailExists = await users.findOne({
        "manager.email": email
    });

    if (EmailExists) {
        
        const error = new Error("Email Id Already Exists");
        error.StatusCode = 408;
        throw error;
    }

    const existingPhone = await users.findOne({
        "manager.phone": phone
    });

    if(existingPhone) {
        const error = new Error("Phone No Already Exists");
        error.StatusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const manager = await users.create({
        role: "manager",
        manager: {
            name,
            email,
            phone,
            password:hashedPassword,
            dob,
            gender
        }
    });

    return manager;

}