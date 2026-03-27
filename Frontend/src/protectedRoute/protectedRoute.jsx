import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context';

const getEffectiveRole = (user) => {
  if (!user) return 'manager';
  if (user.role === 'admin') return 'manager';
  if (user.role) return user.role;
  if (user.isAdmin === false) return 'salesperson';
  return 'manager';
};

const ProtectedRoute = ({ children, allowedRoles = null, redirectTo = '/' }) => {
  const { user, loading } = useGlobalContext();
  const location = useLocation();
  const hasWarnedRef = useRef(false);
  const role = getEffectiveRole(user);

  useEffect(() => {
    if (!loading && user && allowedRoles && !allowedRoles.includes(role) && !hasWarnedRef.current) {
      toast.error("You're not allowed to view this page");
      hasWarnedRef.current = true;
    }
  }, [allowedRoles, loading, user, role, location.pathname]);

  if (loading) {
    return <div className="p-6 text-[var(--muted)]">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
