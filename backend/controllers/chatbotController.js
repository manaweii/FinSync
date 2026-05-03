import jwt from "jsonwebtoken";

import { answerFinSyncQuestion } from "../services/chatbotService.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import UserOrgRelation from "../models/UserOrgRelation.js";
import Role from "../models/Role.js";
import UserRoleRelation from "../models/UserRoleRelation.js";

const MAX_QUESTION_LENGTH = 1200;

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (!authHeader) return null;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim() || null;
};

const getAuthContext = async (req) => {
  const token = extractToken(req);
  if (!token) {
    return { error: { code: 401, message: "Authorization token missing" } };
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { error: { code: 401, message: "Invalid or expired token" } };
  }

  const userId = payload?.userId;
  if (!userId) {
    return { error: { code: 401, message: "Invalid token payload" } };
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    return { error: { code: 404, message: "User not found" } };
  }

  if (user.status && user.status !== "Active") {
    return { error: { code: 403, message: "User account is inactive" } };
  }

  const orgRelation = await UserOrgRelation.findOne({ userId: user._id }).lean();
  if (!orgRelation?.orgId) {
    return { error: { code: 400, message: "Organization context is missing" } };
  }

  const org = await Organization.findById(orgRelation.orgId).lean();
  if (!org) {
    return { error: { code: 404, message: "Organization not found" } };
  }

  if (org.status && org.status !== "Active") {
    return { error: { code: 403, message: "Organization is inactive" } };
  }

  const roleRelation = await UserRoleRelation.findOne({ userId: user._id }).lean();
  const role = roleRelation ? await Role.findById(roleRelation.roleId).lean() : null;

  return {
    userId: user._id,
    orgId: org._id,
    orgName: org.orgName || org.name || "Organization",
    roleName: role?.name || "User",
  };
};

export const askChatbot = async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({
        message: `Question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`,
      });
    }

    const authContext = await getAuthContext(req);
    if (authContext.error) {
      return res.status(authContext.error.code).json({ message: authContext.error.message });
    }

    const response = await answerFinSyncQuestion({
      orgId: authContext.orgId,
      orgName: authContext.orgName,
      roleName: authContext.roleName,
      question,
      history,
    });

    return res.json({
      answer: response.answer,
      meta: response.meta,
    });
  } catch (error) {
    console.error("askChatbot error:", error);
    return res.status(500).json({ message: "Failed to process chatbot request" });
  }
};
