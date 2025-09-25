import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Kiosk from './pages/Kiosk';
import EmployeeDashboard from './pages/EmployeeDashboard';
import History from './pages/History';
import Requests from './pages/Requests';
import AdminDashboard from './pages/admin/AdminDashboard';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

const AppLayout = ({ isSidebarOpen, toggleSidebar }) => {
    const { user } = useAuth();
    if (!user) {
        return <div className="loading-container">Verificando usuario...</div>;
    }
    return (
        <div className={`App ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <main className="main-content">
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    &#9776;
                </button>
                <Outlet />
            </main>
        </div>
    );
};

const AppRoutes = ({ isSidebarOpen, toggleSidebar }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container">Cargando aplicación...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/kiosk" element={<Kiosk />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />}>
                    <Route index element={
                        user?.role === 'Super Admin' ? <Navigate to="/admin/dashboard" replace /> :
                        user?.role === 'Gestor de RRHH' ? <Navigate to="/dashboard" replace /> : // Default HR to employee dash
                        <Navigate to="/dashboard" replace />
                    } />
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="history" element={<History />} />
                    <Route path="requests" element={<Requests />} />

                    {/* Admin-specific routes can be added here */}
                    <Route path="admin" element={<ProtectedRoute requiredRole="Super Admin" />}>
                        <Route path="dashboard" element={<AdminDashboard />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
    );
};

function App() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <Router>
            <AppRoutes isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </Router>
    );
}

export default App;