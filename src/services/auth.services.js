import express from "express"
import users from "../models/users.model.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

// Login Service

export const loginService = async (email, password) => {

    let user = null;

    // ===== CHECK ADMIN =====
    user = await users.findOne({
        "admin.email": email
    });

    let userType = "admin";

    // ===== CHECK MANAGER =====
    if (!user) {

        user = await users.findOne({
            "manager.email": email
        });

        userType = "manager";
    }

    // ===== CHECK STAFF =====
    if (!user) {

        user = await users.findOne({
            "staff.email": email
        });

        userType = "staff";
    }

    // ===== USER NOT FOUND =====
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // ===== CHECK IF USER IS ACTIVE =====
    if (user.isActive === false) {
        const error = new Error("Your account has been deactivated. Please contact administrator.");
        error.statusCode = 403;
        throw error;
    }

    let storedPassword = "";

    if (userType === "admin") {
        storedPassword = user.admin.password;
    }

    if (userType === "manager") {
        storedPassword = user.manager.password;
    }

    if (userType === "staff") {
        storedPassword = user.staff.password;
    }

    // ===== PASSWORD CHECK =====
    const isPasswordValid = await bcrypt.compare(
        password,
        storedPassword
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // ===== JWT TOKEN =====
    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    return {
        token,
        user
    };

};