import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId },
    // from CreateUser form
    fullName: { type: String, required: true },
    // use orgName instead of companyName to match your frontend
    orgName: { type: String },

    // simple role and status for your app
    role: {
      type: String,
      default: "User",
    },
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
  },
  { timestamps: true }
);

// Export the model, not just the schema
const User = mongoose.model("User", userSchema);

export default User;
