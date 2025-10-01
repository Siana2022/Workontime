import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';
import {
    FiGrid, FiUsers, FiAlertTriangle, FiCalendar, FiBriefcase,
    FiClock, FiSettings, FiBarChart2, FiInbox, FiDollarSign, FiGift,
    FiLogOut, FiClipboard, FiUserCheck, FiFileText
} from 'react-icons/fi';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const logoUrl = "https://i.postimg.cc/D28NhLc6/WORKONTIME-20.png";

    const handleLogout = () => {
        if (logout) {
            logout();
        } else {
            console.error("Logout function is not available on the auth context.");
        }
    };

    const getNavLinkClass = ({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link';

    const hrNavLinks = [
        { to: "/hr/dashboard", icon: <FiGrid />, text: "ESCRITORIO" },
        { to: "/hr/employees", icon: <FiUsers />, text: "EMPLEADOS" },
        { to: "/hr/incidents", icon: <FiAlertTriangle />, text: "INCIDENCIAS" },
        { to: "/hr/calendar", icon: <FiCalendar />, text: "CALENDARIO" },
        { to: "/hr/departments", icon: <FiBriefcase />, text: "DEPARTAMENTOS" },
        { to: "/hr/absences", icon: <FiClock />, text: "AUSENCIAS" },
        { to: "/hr/absence-types", icon: <FiSettings />, text: "TIPOS DE AUSENCIA" },
        { to: "/hr/reports", icon: <FiBarChart2 />, text: "INFORMES" },
        { to: "/hr/requests-admin", icon: <FiInbox />, text: "SOLICITUDES" },
        { to: "/hr/annual-balances", icon: <FiDollarSign />, text: "SALDOS" },
        { to: "/hr/holidays", icon: <FiGift />, text: "DÍAS FESTIVOS" },
        { to: "/hr/schedule-types", icon: <FiClipboard />, text: "TIPOS DE HORARIO" },
        { to: "/hr/clients", icon: <FiUserCheck />, text: "CLIENTES" },
        { to: "/hr/client-reports", icon: <FiFileText />, text: "INFORMES DE CLIENTES" },
    ];

    const employeeNavLinks = [
        { to: "/dashboard", icon: <FiGrid />, text: "Escritorio" },
        { to: "/history", icon: <FiBarChart2 />, text: "Historial" },
        { to: "/requests", icon: <FiInbox />, text: "Solicitudes" },
        { to: "/my-calendar", icon: <FiCalendar />, text: "Mi Calendario" },
    ];

    const adminNavLinks = [
         { to: "/admin/dashboard", icon: <FiBriefcase />, text: "Gestión de Empresas" },
    ];

    let navLinks = [];
    if (user?.role === 'Gestor de RRHH') {
        navLinks = hrNavLinks;
    } else if (user?.role === 'Empleado') {
        navLinks = employeeNavLinks;
    } else if (user?.role === 'Super Admin') {
        navLinks = adminNavLinks;
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={logoUrl} alt="Work On Time Logo" className="sidebar-logo" />
            </div>
            <nav className="sidebar-nav">
                <ul>
                    {navLinks.map((link, index) => (
                        <li key={index}>
                            <NavLink to={link.to} className={getNavLinkClass}>
                                {link.icon}
                                <span>{link.text}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <FiLogOut />
                    <span>Salir</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;