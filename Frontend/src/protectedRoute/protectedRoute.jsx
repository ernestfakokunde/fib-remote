import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGlobalContext } from '../context/context';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useGlobalContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
