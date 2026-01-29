import mongoose from "mongoose";

const { Schema } = mongoose;

const orgSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId },

    // Basic identity
    name: { type: String, required: true, trim: true },

    // Contact / billing
    contactEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String },

    // Plan / billing metadata
    plan: {
      type: String,
      enum: ["Starter", "Growth", "Professional", "Enterprise"],
      default: "Starter",
      status: { type: String, default: "active" },
    },

    status: { type: String, enum: ["Active", "Disabled"], default: "Active" },
});

const Organization = mongoose.model("Organization", orgSchema);

export default Organization;
