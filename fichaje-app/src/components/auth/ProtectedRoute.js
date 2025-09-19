import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ requiredRole, allowSuperAdmin = false }) => {
    const { session, user, loading } = useAuth();

    if (loading) {
        // You can render a loading spinner or a blank page here
        return <div>Cargando sesión...</div>;
    }

    if (!session) {
        // If not loading and no session, redirect to login
        return <Navigate to="/login" replace />;
    }

    // If the user object is not yet available (e.g., still fetching), wait.
    // This can happen in a brief moment after session is confirmed but before user data is loaded.
    if (!user) {
        return <div>Verificando usuario...</div>;
    }

    // Super Admins are allowed access to any route when specified
    if (allowSuperAdmin && user.role === 'Super Admin') {
        return <Outlet />;
    }

    // If a specific role is required and the user's role does not match
    if (requiredRole && user.role !== requiredRole) {
        // Redirect them to a page they are authorized to see
        return <Navigate to="/" replace />;
    }

    // If the user is authenticated and has the correct role (or no specific role is required),
    // render the child routes.
    return <Outlet />;
};

export default ProtectedRoute;
