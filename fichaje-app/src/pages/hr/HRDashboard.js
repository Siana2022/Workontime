import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import SummaryCard from '../../components/hr/SummaryCard';
import { FiBell, FiLogOut } from 'react-icons/fi';
import './HRDashboard.css';

const HRDashboard = () => {
    const { companyId, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState({
        activeEmployees: 0,
        pausedEmployees: 0,
        pendingAbsences: 0,
        pendingClockings: 0,
        detectedIncidents: 0
    });

    useEffect(() => {
        if (!companyId) return;

        const fetchDashboardData = async () => {
            setLoading(true);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: employeesData, error: employeesError } = await supabase
                .from('employees')
                .select(`
                    id,
                    name,
                    time_entries (
                        action,
                        created_at
                    )
                `)
                .eq('company_id', companyId)
                .order('created_at', { foreignTable: 'time_entries', ascending: false });

            if (employeesError) {
                console.error("Error fetching employees:", employeesError);
            }

            let activeEmployees = 0;
            let pausedEmployees = 0;
            const processedEmployees = employeesData ? employeesData.map(emp => {
                const todaysEntries = emp.time_entries.filter(e => new Date(e.created_at) >= today);
                const lastEntry = todaysEntries[0];
                let status = 'Fuera';
                let entryTime = '--:--';
                if (lastEntry) {
                    if (lastEntry.action === 'Entrada' || lastEntry.action === 'Reanudar') {
                        status = 'Activo';
                        activeEmployees++;
                    } else if (lastEntry.action === 'Pausa') {
                        status = 'Pausa';
                        pausedEmployees++;
                    }
                    entryTime = new Date(lastEntry.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                }
                return { ...emp, status, entryTime, currentTask: 'Ceivan Medical' }; // Mock task
            }) : [];

            setEmployees(processedEmployees);
            setStats(prev => ({ ...prev, activeEmployees, pausedEmployees }));
            setLoading(false);
        };

        fetchDashboardData();
    }, [companyId]);

    const summaryStats = [
        { title: 'Estado Empleados', to: '/hr/employees', stats: [{ value: stats.activeEmployees, label: 'Activos', color: '#DCEF2B' }, { value: stats.pausedEmployees, label: 'Pausa', color: '#E02F2F' }] },
        { title: 'Solicitudes Pendientes', to: '/hr/requests-admin', stats: [{ value: stats.pendingAbsences, label: 'Ausencias por revisar', color: '#E02F2F' }] },
        { title: 'Ausencias Pendientes', to: '/hr/absences', stats: [{ value: stats.pendingClockings, label: 'Fichajes por revisar', color: '#E02F2F' }] },
        { title: 'Incidencias Detectadas', to: '/hr/incidents', stats: [{ value: stats.detectedIncidents, label: 'Fichajes por revisar', color: '#E02F2F' }] }
    ];

    return (
        <div className="hr-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Escritorio de Fichajes</h1>
                    <p>Un resumen del estado actual de los empleados y las solicitudes.</p>
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

            <div className="summary-grid">
                {summaryStats.map((item, index) => (
                    <Link to={item.to} key={index} className="summary-card-link">
                        <SummaryCard title={item.title} stats={item.stats} />
                    </Link>
                ))}
            </div>

            <div className="employee-details card">
                <h2>Detalle de Empleados (Hoy)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>EMPLEADOS</th>
                            <th>ESTADO ACTUAL</th>
                            <th>HORA DE ENTRADA</th>
                            <th>TAREA ACTUAL</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (<tr><td colSpan="5">Cargando...</td></tr>) :
                            employees.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.name}</td>
                                    <td><span className={`status-${emp.status.toLowerCase()}`}>{emp.status}</span></td>
                                    <td>{emp.entryTime}</td>
                                    <td>{emp.currentTask}</td>
                                    <td><a href="#" className="action-link">Ver Historial</a></td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HRDashboard;