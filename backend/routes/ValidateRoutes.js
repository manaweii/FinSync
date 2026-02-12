import express from "express";
import { login, requestPasswordReset, confirmNewPassword, CreateUser } from "../controllers/authController.js";
import { getUsers, UpdateUser, DeleteUser } from "../repositories/userRepo.js";
import { CreateOrganization, LoadOrganization, UpdateOrganization, DeleteOrganization } from "../repositories/organizationRepo.js";
import { uploadFile, pastImportData } from "../controllers/importController.js";

const router = express.Router();

// Login
router.post("/auth/login", login);
router.post("/auth/reset-password", requestPasswordReset);
router.post("/auth/new-password", confirmNewPassword);

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

export default router;
