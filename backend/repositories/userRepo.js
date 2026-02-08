import { connectAuthDB } from '../config/db.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import UserRoleRelation from '../models/UserRoleRelation.js';
import UserOrgRelation from '../models/UserOrgRelation.js';
import Organization from '../models/Organization.js';

let UserModel;

async function getUserModel() {
  if (UserModel) return UserModel;
  const conn = await connectAuthDB();

  // If model already exists on this connection, reuse it; otherwise register it
  const modelNames = typeof conn.modelNames === 'function' ? conn.modelNames() : Object.keys(conn.models || {});
  if (modelNames.includes('User')) {
    UserModel = conn.model('User');
  } else {
    UserModel = conn.model('User', User);
  }

  return UserModel;
}

export async function findUserByEmail(email) {
  return User.findOne({ email });
}

export function createUser(doc) {
    return User.create(doc);
}

export async function getUsers(req, res) {
  try {
    const { role, orgId } = req.query; // role of current user, and org to filter

    const UserModel = await getUserModel();
    const users = await UserModel.find().lean();

    const enhanced = await Promise.all(
      users.map(async (u) => {
        // find role relation for the user
        const relation = await UserRoleRelation.findOne({ userId: u._id }).lean();
        const roleDetail = relation ? await Role.findById(relation.roleId).lean() : null;

        // find org relation for the user
        const orgRelation = await UserOrgRelation.findOne({ userId: u._id }).lean();
        const orgDetail = orgRelation ? await Organization.findById(orgRelation.orgId).lean() : null;

        const { passwordHash, ...rest } = u;
        return {
          ...rest,
          id: rest._id,
          role: roleDetail ? roleDetail.name : 'User',
          orgId: orgDetail ? orgDetail._id : null,
          orgName: orgDetail ? orgDetail.name : null,
          orgStatus: orgDetail ? orgDetail.status : null,
        };
      })
    );
    // if admin → filter to its org; if superadmin (or no role) → see all
    let filtered = enhanced;
    if (role === "Admin" && orgId) {
      filtered = enhanced.filter((u) => u.orgId?.toString() === orgId.toString());
    }

    res.status(200).json(filtered);
  } catch (err) {
    console.error("Error getting users:", err);
    res.status(500).json({ message: "Failed to get users" });
  }
}

export async function updateLastLogin(userId) {
  const User = await getUserModel();
  return User.findByIdAndUpdate(userId, { $set: { lastLoginAt: new Date() } }, { new: true });
}

// Update user by id (route handler)
export async function UpdateUser(req, res) {
  try {
    const id = req.params.id;
    const updates = req.body;
    if (!id) return res.status(400).json({ message: 'User id is required' });

    const UserModel = await getUserModel();
    const updated = await UserModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'User not found' });

    // remove sensitive fields before returning
    if (updated.passwordHash) delete updated.passwordHash;

    // if role changed, update UserRoleRelation
    if (updates.role) {
      const roleName = updates.role;
      const roleDoc = await Role.findOne({ name: roleName });
      if (roleDoc) {
        await UserRoleRelation.findOneAndUpdate(
          { userId: id },
          { $set: { roleId: roleDoc._id } },
          { upsert: true }
        );
      }
    }

    res.status(200).json({ message: 'User updated', user: updated });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
}

// Delete user by id (route handler)
export async function DeleteUser(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'User id is required' });

    const UserModel = await getUserModel();
    const deleted = await UserModel.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    if (deleted.passwordHash) delete deleted.passwordHash;

    // remove role and org relations
    await UserRoleRelation.deleteOne({ userId: id });
    await UserOrgRelation.deleteOne({ userId: id });

    res.status(200).json({ message: 'User deleted', user: deleted });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
}