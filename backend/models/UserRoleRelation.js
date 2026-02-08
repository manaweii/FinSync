import mongoose from "mongoose";

const { Schema } = mongoose;

const userRoleRelationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
}, { timestamps: true });

const UserRoleRelation = mongoose.model("UserRoleRelation", userRoleRelationSchema);

export default UserRoleRelation;
