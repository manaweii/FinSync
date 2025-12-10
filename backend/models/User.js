import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: { type: String },
    companyName: { type: String },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: { type: String, required: true },

    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String },
    },

    providers: {
      google: { sub: { type: String, index: true } },
      github: { id: { type: String, index: true } },
      // add others as needed
    },

    memberships: [
      {
        tenantId: { type: String, required: true, index: true },
        roles: [{ type: String }], 
      },
    ],

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export default userSchema;
