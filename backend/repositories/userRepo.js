import { connectAuthDB } from '../config/db.js';
import UserSchema from '../models/User.js';

let UserModel;

async function getUserModel() {
  if (UserModel) return UserModel;
  const conn = await connectAuthDB();

  // If model already exists on this connection, reuse it; otherwise register it
  const modelNames = typeof conn.modelNames === 'function' ? conn.modelNames() : Object.keys(conn.models || {});
  if (modelNames.includes('User')) {
    UserModel = conn.model('User');
  } else {
    UserModel = conn.model('User', UserSchema);
  }

  return UserModel;
}

export async function findUserByEmail(email) {
  const User = await getUserModel();
  return User.findOne({ email });
}

export async function createUser(doc) {
  const User = await getUserModel();
  return User.create(doc);
}

export async function updateLastLogin(userId) {
  const User = await getUserModel();
  return User.findByIdAndUpdate(userId, { $set: { lastLoginAt: new Date() } }, { new: true });
}

// Function to get all users
export async function getUsers() {
  const User = await getUserModel();

  // Get all users from database
  const users = await User.find();

  return users;
}