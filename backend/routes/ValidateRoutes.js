import express from "express";
import { login, register } from "../controllers/authController.js";
import { createUser, getUsers } from "../repositories/userRepo.js";
import User from "../models/User.js";
import Org from "../models/Organization.js";
import { uploadFile, pastImportData } from "../controllers/importController.js";
import { requestPasswordReset, confirmNewPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/auth/login", login);
router.post("/auth/createuser", createUser);
router.post("/auth/register", register);
router.post("/auth/reset-password", requestPasswordReset);
router.post("/auth/new-password", confirmNewPassword);


router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error getting users:", err);
    res.status(500).json({ message: "Failed to get users" });
  }
});

// GET /api/orgs -> return all organizations (public for now)
router.get("/orgs", async (req, res) => {
  try {
    const orgs = await Org.find();
    res.status(200).json(orgs);
  } catch (err) {
    console.error("Error fetching orgs:", err);
    res.status(500).json({ message: "Failed to fetch organizations" });
  }
});

router.post("/upload", uploadFile);
router.get("/past-imports", pastImportData);

export default router;
