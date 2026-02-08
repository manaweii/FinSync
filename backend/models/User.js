import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // from CreateUser form
    fullName: { type: String, required: true },
        
    status: {
      type: String,
      default: "Active",
    },

    // auth fields
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // store hashed password here
    passwordHash: { type: String, required: true },

    // optional: MFA
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String },
    },

    lastLoginAt: { type: Date },

    // password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Export the model
const User = mongoose.model("User", userSchema);

export default User;
