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

    monthlyBudget: { type: Number, default: 0 },
    budgetHistory: {
      type: [
        {
          amount: { type: Number, required: true },
          effectiveMonth: { type: String, required: true },
          note: { type: String, default: "" },
          setBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
          setAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

const Organization = mongoose.model("Organization", orgSchema);

export default Organization;
