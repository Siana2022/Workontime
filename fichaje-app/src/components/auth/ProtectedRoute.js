import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ requiredRole, allowSuperAdmin = false }) => {
    const { session, user, loading } = useAuth();

    if (loading) {
        return <div>Cargando sesión...</div>;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (!user) {
        // This can happen for a brief moment between session validation and user profile fetching.
        // AppLayout will show a more detailed message if this state persists.
        return <div>Verificando usuario...</div>;
    }

    // Super Admins are allowed access to any route when specified
    if (allowSuperAdmin && user.role === 'Super Admin') {
        return <Outlet />;
    }

    // If a specific role is required and the user's role does not match
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
