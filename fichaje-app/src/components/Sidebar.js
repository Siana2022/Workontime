import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const auth = useAuth();

    const handleLogout = () => {
        if (auth && typeof auth.logout === 'function') {
            auth.logout();
        } else {
            console.error("Logout function is not available on the auth context.");
        }
    };

    const user = auth?.user;
    const getNavLinkClass = ({ isActive }) => isActive ? 'sidebar-link active-link' : 'sidebar-link';

    return (
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <img src="https://i.postimg.cc/nZvJGfq9/WORKONTIME-21.png" alt="Logo" className="sidebar-logo" />
                <button className="sidebar-close-btn" onClick={toggleSidebar}>&times;</button>
            </div>
            <ul className="sidebar-menu">
                {user?.role === 'Empleado' && (
                    <>
                        <li><NavLink className={getNavLinkClass} to="/dashboard">Escritorio</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/history">Historial</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/requests">Solicitudes</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/my-calendar">Mi Calendario</NavLink></li>
                    </>
                )}

                {user?.role === 'Gestor de RRHH' && (
                    <>
                        <li className="menu-header">Panel de RRHH</li>
                        <li><NavLink className={getNavLinkClass} to="/hr/dashboard">Escritorio</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/employees">Empleados</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/departments">Departamentos</NavLink></li>

                        <li className="menu-header">Ausencias e Incidencias</li>
                        <li><NavLink className={getNavLinkClass} to="/hr/absences">Ausencias</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/incidents">Incidencias</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/absence-types">Tipos de Ausencia</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/incident-types">Tipos de Incidencia</NavLink></li>

                        <li className="menu-header">Calendario y Horarios</li>
                        <li><NavLink className={getNavLinkClass} to="/hr/calendar">Calendario Global</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/holidays">Días Festivos</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/schedule-types">Tipos de horario</NavLink></li>

                        <li className="menu-header">Clientes e Informes</li>
                        <li><NavLink className={getNavLinkClass} to="/hr/clients">Gestión de Clientes</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/client-reports">Informes de Cliente</NavLink></li>

                        <li className="menu-header">Administración</li>
                        <li><NavLink className={getNavLinkClass} to="/hr/reports">Informes Generales</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/requests-admin">Solicitudes (Admin)</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/hr/annual-balances">Saldos Anuales</NavLink></li>
                    </>
                )}

                {user?.role === 'Super Admin' && (
                    <>
                        <li className="menu-header">SUPER ADMIN</li>
                        <li><NavLink className={getNavLinkClass} to="/admin/dashboard">Gestión de Empresas</NavLink></li>
                    </>
                )}

                <li></li>
                <li className="logout-btn-container">
                    <button onClick={handleLogout} className="logout-btn">Salir</button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;