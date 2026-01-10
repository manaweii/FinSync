import express from "express";
import { login, register } from "../controllers/authController.js";
import { createUser } from "../repositories/userRepo.js";

const router = express.Router();

router.post("/login", login);
router.post("/createuser", createUser);

export default router;
