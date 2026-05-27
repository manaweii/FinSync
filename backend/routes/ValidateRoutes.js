import express from "express";
import mongoose from "mongoose";
import { login, requestPasswordReset, confirmNewPassword, CreateUser, getProfile } from "../controllers/authController.js";
import { getUsers, UpdateUser, DeleteUser } from "../repositories/userRepo.js";
import { CreateOrganization, LoadOrganization, UpdateOrganization, DeleteOrganization } from "../repositories/organizationRepo.js";
import { uploadFile, pastImportData, getImportById } from "../controllers/importController.js";
import {
  createManualRecord,
  getRecordsByOrgName,
  saveFruityGoRecords,
  updateManualRecord,
} from "../controllers/recordController.js";
import { saveDashboardSettings, getDashboardSettings } from "../controllers/dashboardController.js";
import { getOrgPredictions, savePredictionMilestone } from "../controllers/predictionController.js";
import { askChatbot } from "../controllers/chatbotController.js";
import Notification from "../models/Notification.js";
import contactRoutes from './ContactRoutes.js';

const router = express.Router();

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapNotification(doc) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    role: doc.role,
    orgId: doc.orgId ? doc.orgId.toString() : null,
    title: doc.title,
    message: doc.message,
    time: new Date(doc.createdAt).toLocaleString(),
    createdAt: doc.createdAt,
    readAt: doc.readAt || null,
    isRead: Boolean(doc.readAt),
  };
}

function applyNotificationScope({ requestedRole, orgId }) {
  const query = {};
  const normalizedRole = requestedRole.toLowerCase();

  if (normalizedRole && normalizedRole !== "superadmin") {
    query.role = { $regex: `^${escapeRegex(requestedRole)}$`, $options: "i" };
  }

  if (orgId) {
    query.orgId = orgId;
  }

  return query;
}

// Login
router.post("/auth/login", login);
router.post("/auth/reset-password", requestPasswordReset);
router.post("/auth/new-password", confirmNewPassword);

// Profile
router.get('/auth/profile', getProfile);

// User Management
router.get("/users", getUsers);
router.post("/createUser", CreateUser);
router.put("/users/:id", UpdateUser);
router.delete("/users/:id", DeleteUser);

// Organization Management
router.get("/orgs", LoadOrganization);
router.post("/createorg", CreateOrganization);
router.put("/orgs/:id", UpdateOrganization);
router.delete("/orgs/:id", DeleteOrganization);

// Import routes
router.post("/upload", uploadFile);
router.get("/past-imports/:orgId", pastImportData);
router.get('/imports/:id', getImportById);

// Records routes
router.post("/records/fruitygo", saveFruityGoRecords);
router.get("/records", getRecordsByOrgName);
router.post("/records/manual", createManualRecord);
router.put("/records/manual/:id", updateManualRecord);

// Dashboard settings
router.post('/dashboard-settings', saveDashboardSettings);
router.get('/dashboard-settings/:id', getDashboardSettings);

// Predictions
router.get("/predictions/:orgId", getOrgPredictions);
router.post("/predictions/milestones", savePredictionMilestone);

// Chatbot
router.post("/chatbot/ask", askChatbot);

// Notifications
router.get("/notifications", async (req, res) => {
  try {
    const requestedRole = (req.query.role || "").toString().trim();
    const afterRaw = (req.query.after || "").toString().trim();
    const orgId = (req.query.orgId || "").toString().trim();

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 500)
      : 200;

    if (orgId && !mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: "Invalid orgId" });
    }

    const query = applyNotificationScope({ requestedRole, orgId });

    if (afterRaw) {
      const afterDate = new Date(afterRaw);
      if (Number.isNaN(afterDate.getTime())) {
        return res.status(400).json({ message: "Invalid 'after' timestamp" });
      }
      query.createdAt = { $gt: afterDate };
    }

    const unreadCountQuery = { ...applyNotificationScope({ requestedRole, orgId }), readAt: null };

    const [docs, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments(unreadCountQuery),
    ]);

    const notifications = docs.map(mapNotification);

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.patch("/notifications/read", async (req, res) => {
  try {
    const requestedRole = (req.body?.role || "").toString().trim();
    const orgId = (req.body?.orgId || "").toString().trim();
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];

    if (orgId && !mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: "Invalid orgId" });
    }

    const scopeQuery = applyNotificationScope({ requestedRole, orgId });
    const updateQuery = {
      ...scopeQuery,
      readAt: null,
    };

    if (ids.length) {
      const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (!validIds.length) {
        const unreadCount = await Notification.countDocuments({ ...scopeQuery, readAt: null });
        return res.json({ updatedCount: 0, unreadCount });
      }
      updateQuery._id = { $in: validIds };
    }

    const result = await Notification.updateMany(updateQuery, { $set: { readAt: new Date() } });
    const unreadCount = await Notification.countDocuments({ ...scopeQuery, readAt: null });

    return res.json({
      updatedCount: result.modifiedCount || 0,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const { type, role, orgId, title, message } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({ message: "title and message are required" });
    }
    if (orgId && !mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: "Invalid orgId" });
    }

    const created = await Notification.create({
      type: type || "account_created",
      role: role || "Admin",
      orgId: orgId || null,
      title,
      message,
      readAt: null,
    });

    return res.status(201).json({
      id: created._id.toString(),
      type: created.type,
      role: created.role,
      orgId: created.orgId ? created.orgId.toString() : null,
      title: created.title,
      message: created.message,
      time: new Date(created.createdAt).toLocaleString(),
      createdAt: created.createdAt,
      readAt: created.readAt || null,
      isRead: Boolean(created.readAt),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(204).send();
    }
    await Notification.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

router.post("/notifications/clear", async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.json({ deletedCount: 0 });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) {
      return res.json({ deletedCount: 0 });
    }

    const result = await Notification.deleteMany({ _id: { $in: validIds } });
    return res.json({ deletedCount: result.deletedCount || 0 });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    return res.status(500).json({ message: "Failed to clear notifications" });
  }
});

// Contact routes (contact form)
router.use(contactRoutes);

export default router;
