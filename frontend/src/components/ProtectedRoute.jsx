import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { chatState } from "../Context/ChatProvider";

const ProtectedRoute = () => {
  const { user } = chatState();

  // If no user is logged in, redirect to login/signup page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
