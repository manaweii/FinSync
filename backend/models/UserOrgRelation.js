import mongoose from "mongoose";

const { Schema } = mongoose;

const userOrgRelationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
}, { timestamps: true });

const UserOrgRelation = mongoose.model("UserOrgRelation", userOrgRelationSchema);

export default UserOrgRelation;
