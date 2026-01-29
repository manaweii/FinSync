// db.js
import mongoose from "mongoose";

// import your models
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRoleRelation from "../models/UserRoleRelation.js";
import UserOrgRelation from "../models/UserOrgRelation.js";
import ImportModel from "../models/Import.js";

export async function connectAuthDB() {
  // Reuse existing connection when possible
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL;

  if (!uri) {
    const msg =
      "No MongoDB URI found in environment (set MONGO_URI or MONGODB_URI or MONGO_URL)";
    console.error(msg);
    throw new Error(msg);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.AUTH_DB_NAME || "finsyncdb",
    });

    console.log("MongoDB connected");

    // Explicitly ensure collections exist 
    await Promise.all([
      Organization.createCollection(),
      User.createCollection(),
      Role.createCollection(),
      UserRoleRelation.createCollection(),
      UserOrgRelation.createCollection(),
      ImportModel.createCollection(),
    ]);

    console.log("Collections ensured");

    return conn.connection;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

export default connectAuthDB;
