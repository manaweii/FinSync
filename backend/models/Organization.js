import mongoose from "mongoose";

const { Schema } = mongoose;

const orgSchema = new Schema(
  {
    // Basic identity
    orgName: { type: String, trim: true },
    fullName: { type: String, trim: true },

    // Contact / billing
    contactEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },

    // Plan / billing metadata
    plan: {
      type: String,
      enum: ["Starter", "Growth", "Professional", "Enterprise"],
      default: "Starter"
    },

    status: { type: String, enum: ["Active", "Disabled", "Pending"] },
  },
  { timestamps: true },
);

const Organization = mongoose.model("Organization", orgSchema);

export default Organization;
