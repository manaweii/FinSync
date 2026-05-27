import React from "react";
import useAuthStore from "../../store/useAuthStore";
import { normalizeRole } from "../../utils/roles";
import Forbidden from "./Forbidden";

export default function RequireRole({ allowedRoles = [], children }) {
  const { role, user } = useAuthStore();
  const currentRole = normalizeRole(user?.role || role);
  const allowed = allowedRoles.map(normalizeRole);

  if (!allowed.includes(currentRole)) {
    return <Forbidden />;
  }

  return children;
}
