import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../repositories/userRepo.js";

import User from "../models/User.js"; 

const SALT_ROUNDS = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGISTER
export const CreateUser = async (req, res) => {
  try {
    const { fullName, organization, email, password, role } = req.body;

    const userName = fullName || "";
    const org = organization || "";
    const userRole = role || "User";

    if (!email || !password || !userName) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existing = await findUserByEmail(email);
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    // simple password rule example
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userDoc = await createUser({
      fullName: userName,
      orgName: org,
      email,
      passwordHash,
      role: userRole,
    });

    res.status(201).json({
      message: "Account created",
      user: {
        id: userDoc._id,
        fullName: userDoc.fullName,
        email: userDoc.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    await updateLastLogin(user._id).catch(() => {});

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        orgId: user.orgId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// REQUEST PASSWORD RESET 
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await findUserByEmail(email);

    // Do not reveal whether user exists
    if (!user) {
      return res.json({
        message:
          "If an account exists, a reset link has been sent to your email.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 15; // 15 minutes

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `http://localhost:3000/new-password?token=${token}`;

    // TODO: send real email. For now, log to server
    console.log("Password reset link:", resetUrl);

    return res.json({
      message:
        "If an account exists, a reset link has been sent to your email.",
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// CONFIRM NEW PASSWORD (called by NewPassword.js)
export const confirmNewPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    // same password rule used at register
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password has been updated successfully" });
  } catch (err) {
    console.error("confirmNewPassword error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
