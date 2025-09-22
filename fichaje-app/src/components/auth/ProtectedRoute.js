import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ requiredRole, allowSuperAdmin = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Cargando sesión...</div>;
    }

    if (!user) {
        // If not loading and no user object, redirect to login
        return <Navigate to="/login" replace />;
    }

    // Super Admins are allowed access to any route when specified
    if (allowSuperAdmin && user.role === 'Super Admin') {
        return <Outlet />;
    }

    // If a specific role is required and the user's role does not match
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    // If the user is authenticated and has the correct role (or no specific role is required),
    // render the child routes.
    return <Outlet />;
};

export default ProtectedRoute;
