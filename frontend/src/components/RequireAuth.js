import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const location = useLocation();

  // If no token, redirect to login and preserve attempted location
  if (!token) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  return children;
}
