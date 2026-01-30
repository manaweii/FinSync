import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../repositories/userRepo.js";

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
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

    const existing = await findUserByEmail(email);
    if (existing)
      return res.status(409).json({ message: "User already exists" });

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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

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
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
