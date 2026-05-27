export const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase();

export const isSuperadminRole = (role) => normalizeRole(role) === "superadmin";

export const isAdminRole = (role) => normalizeRole(role) === "admin";
