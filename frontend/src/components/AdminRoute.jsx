import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute = ({ children }) => {
  const { currUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
      </div>
    );
  }

  if (!currUser || currUser.role !== 'admin') {
    console.warn("Access denied. Admin rights required.");
    return <Navigate to="/listings" replace />;
  }

  return children;
};

export default AdminRoute;
