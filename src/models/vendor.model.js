import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({

    vendorName: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true
    },

    email: {
        type: String
    },

    address: {

        city: {
            type: String
        },

        district: {
            type: String
        },

        state: {
            type: String
        },

        pincode: {
            type: String
        }

    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "vendors",
    vendorSchema
);