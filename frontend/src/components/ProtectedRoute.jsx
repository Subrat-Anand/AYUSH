import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequirePatient({ children }) {
  const { isPatient } = useAuth();
  if (!isPatient) return <Navigate to="/patient/auth" replace />;
  return children;
}

export function RequireDoctor({ children }) {
  const { isDoctor } = useAuth();
  if (!isDoctor) return <Navigate to="/doctor/auth" replace />;
  return children;
}
