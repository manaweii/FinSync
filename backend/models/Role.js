import mongoose from "mongoose";

const { Schema } = mongoose;

const roleSchema = new Schema({
  name: { type: String, required: true, enum: ["SuperAdmin", "Admin", "User"] },
  description: { type: String },
}, { timestamps: true });

const Role = mongoose.model("Role", roleSchema);

export default Role;
