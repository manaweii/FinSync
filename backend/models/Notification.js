import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    type: { type: String, required: true, default: "account_created" },
    role: { type: String, required: true, default: "Admin" },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // Null means unread. Set to a timestamp once acknowledged/read.
    readAt: { type: Date, default: null, index: true },
    dedupeKey: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
