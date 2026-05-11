import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "manager", "staff"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    
    joiningDate: {
        type: Date,
        default: Date.now,
      },

    // ===== ADMIN =====
    admin: {
      name: {
        type: String,
      },

      email: {
        type: String,
      },

      password: {
        type: String,
      }
    },

    // ===== MANAGER =====
    manager: {
      name: {
        type: String,
      },

      email: {
        type: String,
      },

      phone: {
        type: String,
      },

      password: {
        type: String,
      },

      dob: {
        type: Date,
      },

      gender: {
        type: String,
      },
    },

    // ===== STAFF =====
    staff: {
      name: {
        type: String,
      },

      email: {
        type: String,
      },

      phone: {
        type: String,
      },

      password: {
        type: String,
      },

      dob: {
        type: Date,
      },

      gender: {
        type: String,
      },

  
    },
  },
  
  {
    timestamps: true,
  }
);

export default mongoose.model("users", userSchema);