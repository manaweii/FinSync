import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import {
  findUserByEmail,
  createUser,
  updateLastLogin,
} from "../repositories/userRepo.js";

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import UserOrgRelation from "../models/UserOrgRelation.js";
import Role from "../models/Role.js";
import UserRoleRelation from "../models/UserRoleRelation.js";
import Subscription from "../models/Subscription.js";
import { sendPasswordResetOtpEmail } from "../services/emailService.js";

const SALT_ROUNDS = 10;
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 1000 * 60 * 10;
const OTP_RESEND_GAP_MS = 1000 * 60;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function generateNumericOtp(length = OTP_LENGTH) {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i += 1) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }

  return otp;
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// REGISTER
export const CreateUser = async (req, res) => {
  try {
    const { fullName, organization, email, password, role } = req.body;
    console.log("CreateUser body:", req.user);
    const userName = fullName || "";
    // const org = organization || "";
    const userRole = role || "User";

    if (!email || !password || !userName) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    // simple password rule example
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // decide orgId based on creator
    let orgId = null;

    if (!organization) {
      return res.status(400).json({ message: "Organization is required" });
    }
    const orgDoc = await Organization.findOne({ name: organization });
    if (!orgDoc) {
      return res.status(400).json({ message: "Organization not found" });
    }
    orgId = orgDoc._id;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userDoc = await createUser({
      fullName: userName,
      email: normalizedEmail,
      passwordHash,
    });

    UserOrgRelation.create({
      userId: userDoc._id,
      orgId: orgId,
    });

    const roleDetail = await Role.findOne({ name: userRole });

    UserRoleRelation.create({
      userId: userDoc._id,
      roleId: roleDetail._id,
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

    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    await updateLastLogin(user._id).catch(() => {});

    // Find active relation for this user
    const userOrgRelation = await UserOrgRelation.findOne({
      userId: user._id,
    });

    const orgDetail = await Organization.findOne({
      _id: userOrgRelation.orgId,
    });

    const userRoleRelation = await UserRoleRelation.findOne({
      userId: user._id,
    });

    const roleDetail = await Role.findOne({ _id: userRoleRelation.roleId });

    // Prevent login for disabled users or orgs
    if (user.status !== "Active") {
      return res.status(403).json({ message: "User account is inactive" });
    }
    if (orgDetail && orgDetail.status !== "Active") {
      return res.status(403).json({ message: "Organization is inactive" });
    }

    // Additional payment check for Admin users: ensure payment is active
    if (roleDetail && roleDetail.name === 'Admin') {
      try {
        const last = await Subscription.findOne({ billingEmail: user.email })
          .sort({ createdAt: -1 })
          .lean();
        if (!last || last.status !== "Active") {
          return res.status(403).json({ message: 'Payment required to activate account' });
        }
      } catch (e) {
        console.error('Subscription check failed', e);
        // allow login to proceed on subscription DB error? safer to block
        return res.status(500).json({ message: 'Payment verification failed' });
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userStatus: user.status,
        role: roleDetail.name,
        orgId: orgDetail ? orgDetail._id : null,
        orgName: orgDetail ? orgDetail.name : null,
        orgStatus: orgDetail ? orgDetail.status : null,
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

    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await findUserByEmail(normalizedEmail);

    // Do not reveal whether user exists
    if (!user) {
      return res.json({
        message:
          "If an account exists, an OTP has been sent to your email.",
      });
    }

    if (
      user.resetPasswordOtpRequestedAt &&
      Date.now() - new Date(user.resetPasswordOtpRequestedAt).getTime() <
        OTP_RESEND_GAP_MS
    ) {
      return res.status(429).json({
        message: "Please wait a minute before requesting another OTP.",
      });
    }

    const otp = generateNumericOtp();
    user.resetPasswordOtpHash = hashOtp(otp);
    user.resetPasswordOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetPasswordOtpRequestedAt = new Date();

    try {
      await sendPasswordResetOtpEmail({
        email: user.email,
        otp,
      });
    } catch (mailError) {
      console.error("Failed to send password reset OTP:", mailError.message);
      return res.status(500).json({
        message:
          "We could not send the OTP email right now. Try again.",
      });
    }

    await user.save();

    return res.json({
      message:
        "If an account exists, an OTP has been sent to your email.",
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// CONFIRM NEW PASSWORD (called by NewPassword.js)
export const confirmNewPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp || !password) {
      return res
        .status(400)
        .json({ message: "Email, OTP and new password are required" });
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be 6 digits" });
    }

    // same password rule used at register
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email, OTP, or expired reset request" });
    }

    if (
      !user.resetPasswordOtpHash ||
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires.getTime() <= Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "OTP is invalid or has expired" });
    }

    if (user.resetPasswordOtpHash !== hashOtp(otp)) {
      return res.status(400).json({ message: "OTP is invalid or has expired" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user.passwordHash = passwordHash;
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpRequestedAt = undefined;
    await user.save();

    return res.json({ message: "Password has been updated successfully" });
  } catch (err) {
    console.error("confirmNewPassword error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET current authenticated user's profile
export const getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Authorization header missing" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    if (!token) return res.status(401).json({ message: "Token missing" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = payload.userId;
    if (!userId) return res.status(400).json({ message: "Invalid token payload" });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Load user's organization relation
    const userOrgRelation = await UserOrgRelation.findOne({ userId: user._id });
    const orgDetail = userOrgRelation
      ? await Organization.findById(userOrgRelation.orgId).lean()
      : null;

    // Load user's role relation
    const userRoleRelation = await UserRoleRelation.findOne({ userId: user._id });
    const roleDetail = userRoleRelation
      ? await Role.findById(userRoleRelation.roleId).lean()
      : null;

    // Prevent access for disabled users/orgs
    if (user.status && user.status !== "Active") {
      return res.status(403).json({ message: "User account is inactive" });
    }
    if (orgDetail && orgDetail.status && orgDetail.status !== "Active") {
      return res.status(403).json({ message: "Organization is inactive" });
    }

    return res.json({
      message: "Profile fetched",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userStatus: user.status || "Active",
        role: roleDetail ? roleDetail.name : "User",
        orgId: orgDetail ? orgDetail._id : null,
        orgName: orgDetail ? orgDetail.name : null,
        orgStatus: orgDetail ? orgDetail.status : null,
      },
    });
  } catch (err) {
    console.error("getProfile error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
