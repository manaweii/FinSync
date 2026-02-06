import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export default function RequireAuth({ children }) {
  const { isLoggedIn } = useAuthStore();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  return children;
}
