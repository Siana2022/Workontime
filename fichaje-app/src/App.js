import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { FiBell, FiLogOut } from 'react-icons/fi';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Kiosk from './pages/Kiosk';
import EmployeeDashboard from './pages/EmployeeDashboard';
import History from './pages/History';
import Requests from './pages/Requests';
import EmployeeCalendar from './pages/EmployeeCalendar';
import HRDashboard from './pages/hr/HRDashboard';
import HREmployees from './pages/hr/HREmployees';
import HRDepartments from './pages/hr/HRDepartments';
import HRAbsenceTypes from './pages/hr/HRAbsenceTypes';
import HRIncidentTypes from './pages/hr/HRIncidentTypes';
import HRAbsences from './pages/hr/HRAbsences';
import HRIncidents from './pages/hr/HRIncidents';
import HRGlobalCalendar from './pages/hr/HRGlobalCalendar';
import HRHolidays from './pages/hr/HRHolidays';
import HRScheduleTypes from './pages/hr/HRScheduleTypes';
import HRClients from './pages/hr/HRClients';
import HRReports from './pages/hr/HRReports';
import HRClientReports from './pages/hr/HRClientReports';
import HRRequestsAdmin from './pages/hr/HRRequestsAdmin';
import HRAnnualBalances from './pages/hr/HRAnnualBalances';
import AdminDashboard from './pages/admin/AdminDashboard';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

const AppLayout = () => {
    const { user, logout } = useAuth();
    if (!user) {
        return <div className="loading-container">Verificando usuario...</div>;
    }
    return (
        <div className="App">
            <Sidebar />
            <main className="main-content">
                <header className="dashboard-header">
                    {/* This title is now static, we can improve it later if needed */}
                    <div>
                        <h1>Escritorio</h1>
                        <p>Bienvenido, {user.name || 'Usuario'}.</p>
                    </div>
                    <div className="header-actions">
                        <Link to="/hr/incidents" className="header-action-link">
                            <FiBell />
                        </Link>
                        <button onClick={logout} className="header-action-button">
                            <FiLogOut />
                        </button>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
};

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container">Cargando aplicación...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/kiosk" element={<Kiosk />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppLayout />}>
                    <Route index element={
                        user?.role === 'Super Admin' ? <Navigate to="/admin/dashboard" replace /> :
                        user?.role === 'Gestor de RRHH' ? <Navigate to="/hr/dashboard" replace /> :
                        <Navigate to="/dashboard" replace />
                    } />

                    {/* Employee Routes */}
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="history" element={<History />} />
                    <Route path="requests" element={<Requests />} />
                    <Route path="my-calendar" element={<EmployeeCalendar />} />

                    {/* HR Routes */}
                    <Route path="hr" element={<ProtectedRoute requiredRole="Gestor de RRHH" allowSuperAdmin={true} />}>
                        <Route path="dashboard" element={<HRDashboard />} />
                        <Route path="employees" element={<HREmployees />} />
                        <Route path="departments" element={<HRDepartments />} />
                        <Route path="absences" element={<HRAbsences />} />
                        <Route path="absence-types" element={<HRAbsenceTypes />} />
                        <Route path="incidents" element={<HRIncidents />} />
                        <Route path="incident-types" element={<HRIncidentTypes />} />
                        <Route path="calendar" element={<HRGlobalCalendar />} />
                        <Route path="holidays" element={<HRHolidays />} />
                        <Route path="schedule-types" element={<HRScheduleTypes />} />
                        <Route path="clients" element={<HRClients />} />
                        <Route path="reports" element={<HRReports />} />
                        <Route path="client-reports" element={<HRClientReports />} />
                        <Route path="requests-admin" element={<HRRequestsAdmin />} />
                        <Route path="annual-balances" element={<HRAnnualBalances />} />
                    </Route>

                    {/* Super Admin Routes */}
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
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}

export default App;