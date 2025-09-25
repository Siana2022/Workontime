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
                    </>
                )}

                {user?.role === 'Gestor de RRHH' && (
                    <>
                        {/* Simplified for now, assuming HR uses the same dash as employee */}
                        <li><NavLink className={getNavLinkClass} to="/dashboard">Escritorio</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/history">Historial</NavLink></li>
                        <li><NavLink className={getNavLinkClass} to="/requests">Solicitudes</NavLink></li>
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