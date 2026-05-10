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

      joiningDate: {
        type: Date,
        default: Date.now,
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

      joiningDate: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("users", userSchema);