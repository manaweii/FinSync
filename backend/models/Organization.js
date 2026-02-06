import mongoose from "mongoose";

const { Schema } = mongoose;

const orgSchema = new Schema(
  {
    // Basic identity
    name: { type: String, required: true, trim: true },

    // Contact / billing
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },

    // Plan / billing metadata
    plan: {
      type: String,
      enum: ["Starter", "Growth", "Professional", "Enterprise"],
      default: "Starter"
    },

    status: { type: String, enum: ["Active", "Disabled"] },
});

const Organization = mongoose.model("Organization", orgSchema);

export default Organization;
