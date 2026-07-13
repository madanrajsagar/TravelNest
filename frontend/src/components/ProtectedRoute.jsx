import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export const ProtectedRoute = ({ children }) => {
  const { currUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-rose border-t-transparent"></div>
      </div>
    );
  }

  if (!currUser) {
    toast.warn("Please log in to access this page.");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
