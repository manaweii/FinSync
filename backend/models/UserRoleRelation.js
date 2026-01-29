import mongoose from "mongoose";

const { Schema } = mongoose;

const userRoleRelationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
  orgId: { type: Schema.Types.ObjectId, ref: "Org" }, // optional: role scoped to org
}, { timestamps: true });

const UserRoleRelation = mongoose.model("UserRoleRelation", userRoleRelationSchema);

export default UserRoleRelation;
