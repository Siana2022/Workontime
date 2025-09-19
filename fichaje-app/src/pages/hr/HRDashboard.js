import React, { useState, useEffect } from 'react';
import StatCard from '../../components/hr/StatCard';
import ShortcutButton from '../../components/hr/ShortcutButton';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRDashboard.css';

const HRDashboard = () => {
    const { companyId } = useAuth();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        pendingRequests: 0,
        activeToday: 0,
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const fetchDashboardStats = async () => {
            setLoading(true);

            // --- Date calculations for queries ---
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            fiveDaysAgo.setHours(0, 0, 0, 0); // Start of 5 days ago

            // --- Parallel data fetching ---
            const [employeeRes, requestsRes, activeTodayRes, activityRes] = await Promise.all([
                supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
                supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Pendiente').eq('company_id', companyId),
                supabase.from('time_entries').select('employee_id').eq('action', 'Entrada').gte('created_at', today.toISOString()).eq('company_id', companyId),
                supabase.from('time_entries').select('*').gte('created_at', fiveDaysAgo.toISOString()).eq('company_id', companyId).order('created_at', { ascending: false }).limit(10)
            ]);

            // --- Process results ---
            const newStats = {};

            // Total Employees
            if (employeeRes.error) console.error('Error fetching employee count:', employeeRes.error);
            else newStats.totalEmployees = employeeRes.count;

            // Pending Requests
            if (requestsRes.error) console.error('Error fetching pending requests count:', requestsRes.error);
            else newStats.pendingRequests = requestsRes.count;

            // Active Today
            if (activeTodayRes.error) console.error('Error fetching active employees:', activeTodayRes.error);
            else {
                const uniqueActiveIds = new Set(activeTodayRes.data.map(e => e.employee_id));
                newStats.activeToday = uniqueActiveIds.size;
            }

            // Recent Activity
            if (activityRes.error) console.error('Error fetching recent activity:', activityRes.error);
            else setRecentActivity(activityRes.data);

            setStats(prevStats => ({ ...prevStats, ...newStats }));
            setLoading(false);
        };

        fetchDashboardStats();
    }, [companyId]);

    const shortcuts = [
        { title: 'Gestionar Empleados', to: '/hr/employees' },
        { title: 'Ver Informes', to: '/hr/reports' },
        { title: 'Administrar Solicitudes', to: '/hr/requests-admin' },
        { title: 'Calendario Global', to: '/hr/calendar' },
    ];

    return (
        <div className="hr-dashboard">
            <h1>Escritorio de RRHH</h1>

            <section className="dashboard-section">
                <h2>Resumen General</h2>
                <div className="stats-grid">
                    <StatCard title="Total de Empleados" value={loading ? '...' : stats.totalEmployees} />
                    <StatCard title="Solicitudes Pendientes" value={loading ? '...' : stats.pendingRequests} />
                    <StatCard title="Activos Hoy" value={loading ? '...' : stats.activeToday} />
                </div>
            </section>

            <section className="dashboard-section">
                <h2>Accesos Directos</h2>
                <div className="shortcuts-grid">
                    {shortcuts.map(shortcut => (
                        <ShortcutButton key={shortcut.to} title={shortcut.title} to={shortcut.to} />
                    ))}
                </div>
            </section>

            <section className="dashboard-section">
                <h2>Actividad Reciente (Últimos 5 días)</h2>
                <div className="recent-activity-widget">
                    {loading ? <p>Cargando actividad...</p> :
                        <ul className="activity-list">
                            {recentActivity.length > 0 ? recentActivity.map(entry => (
                                <li key={entry.id} className="activity-item">
                                    <span className="activity-name">{entry.employee_name}</span>
                                    <span className={`activity-action action-${entry.action.toLowerCase()}`}>{entry.action}</span>
                                    <span className="activity-time">{new Date(entry.created_at).toLocaleString('es-ES')}</span>
                                </li>
                            )) : <p>No hay actividad reciente.</p>}
                        </ul>
                    }
                </div>
            </section>
        </div>
    );
};

export default HRDashboard;
