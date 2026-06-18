import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminProtectedRoute() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== 'admin' && !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
