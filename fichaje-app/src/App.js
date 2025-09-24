import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

// A layout for authenticated users that includes the sidebar
const AppLayout = () => {
    const { user, logout } = useAuth();

    // With custom auth, if there's no user object, they are not logged in.
    // The ProtectedRoute handles the redirect, so we just need to wait for loading.
    // This component will only be rendered on a protected route.
    if (!user) {
        return <div className="loading-container">Verificando usuario...</div>;
    }

    return (
        <div className="App">
            <Sidebar />
            <main className="main-content">
                <Outlet /> {/* Child routes will render here */}
            </main>
        </div>
    );
};

// This component handles the main routing logic
const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-container">Cargando aplicación...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/kiosk" element={<Kiosk />} />

            {/* All authenticated routes are children of this element */}
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
                        <Route path="reports" an d element={<HRReports />} />
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

            {/* Fallback for any other path */}
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
    );
};

// The main App component now just sets up the router
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
