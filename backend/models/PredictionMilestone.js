import mongoose from "mongoose";

const { Schema } = mongoose;

const predictionMilestoneSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    metric: {
      type: String,
      enum: ["revenue", "profit"],
      default: "profit",
    },
    targetValue: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

const PredictionMilestone = mongoose.model("PredictionMilestone", predictionMilestoneSchema);

export default PredictionMilestone;
