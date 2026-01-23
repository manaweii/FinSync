import express from "express";
import { login, register } from "../controllers/authController.js";
import { createUser, getUsers } from "../repositories/userRepo.js";
import User from "../models/User.js"; 

const router = express.Router();

router.post("/auth/login", login);
router.post("/auth/createuser", createUser);
router.post("/auth/register", register);

// GET /api/users  -> return all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();      // read from MongoDB
    res.status(200).json(users);         // send JSON back
  } catch (err) {
    console.error("Error getting users:", err);
    res.status(500).json({ message: "Failed to get users" });
  }
});

export default router;
