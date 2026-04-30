import express from "express";
import mongoose from "mongoose";
import { login, requestPasswordReset, confirmNewPassword, CreateUser, getProfile } from "../controllers/authController.js";
import { getUsers, UpdateUser, DeleteUser } from "../repositories/userRepo.js";
import { CreateOrganization, LoadOrganization, UpdateOrganization, DeleteOrganization } from "../repositories/organizationRepo.js";
import { uploadFile, pastImportData, getImportById } from "../controllers/importController.js";
import { saveDashboardSettings, getDashboardSettings } from "../controllers/dashboardController.js";
import { getOrgPredictions, savePredictionMilestone } from "../controllers/predictionController.js";
import Notification from "../models/Notification.js";

const router = express.Router();

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

// Dashboard settings
router.post('/dashboard-settings', saveDashboardSettings);
router.get('/dashboard-settings/:id', getDashboardSettings);

// Predictions
router.get("/predictions/:orgId", getOrgPredictions);
router.post("/predictions/milestones", savePredictionMilestone);

// Notifications
router.get("/notifications", async (req, res) => {
  try {
    const requestedRole = (req.query.role || "").toString().trim();
    const normalizedRole = requestedRole.toLowerCase();

    const query =
      normalizedRole && normalizedRole !== "superadmin"
        ? { role: { $regex: `^${escapeRegex(requestedRole)}$`, $options: "i" } }
        : {};

    const docs = await Notification.find(query).sort({ createdAt: -1 }).limit(200).lean();
    const notifications = docs.map((doc) => ({
      id: doc._id.toString(),
      type: doc.type,
      role: doc.role,
      title: doc.title,
      message: doc.message,
      time: new Date(doc.createdAt).toLocaleString(),
      createdAt: doc.createdAt,
    }));

    return res.json(notifications);
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const { type, role, title, message } = req.body || {};

    if (!title || !message) {
      return res.status(400).json({ message: "title and message are required" });
    }

    const created = await Notification.create({
      type: type || "account_created",
      role: role || "Admin",
      title,
      message,
    });

    return res.status(201).json({
      id: created._id.toString(),
      type: created.type,
      role: created.role,
      title: created.title,
      message: created.message,
      time: new Date(created.createdAt).toLocaleString(),
      createdAt: created.createdAt,
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

export default router;
