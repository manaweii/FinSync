const { getTenantConnection } = require('../config/db');
const { Schema } = require('mongoose');

const RoleBindingSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    roles: [{ type: String }],
  },
  { timestamps: true }
);

async function getRoleBindingModel(tenantId) {
  const conn = await getTenantConnection(tenantId);
  return conn.model('RoleBinding', RoleBindingSchema);
}

async function getUserRoles(tenantId, userId) {
  const RB = await getRoleBindingModel(tenantId);
  const doc = await RB.findOne({ userId });
  return doc?.roles || [];
}

module.exports = { getUserRoles };
