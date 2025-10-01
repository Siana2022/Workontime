import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import SummaryCard from '../../components/hr/SummaryCard';
import { FiBell, FiArrowRight } from 'react-icons/fi';
import './HRDashboard.css';

const HRDashboard = () => {
    const { companyId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState({
        activeEmployees: 0,
        pausedEmployees: 0,
        activeFreelancers: 2, // Mock data
        pendingAbsences: 0,
        pendingClockings: 0,
        detectedIncidents: 0
    });

    // Mock data for freelancers as the schema is unknown
    const freelancers = [
        { name: 'Nacho Córdoba', status: 'Activo', task_start_time: '09:51:32', current_task: 'Olympikus' },
        { name: 'Siana Digital', status: 'Activo', task_start_time: '08:59', current_task: 'Siana Digital' }
    ];

    useEffect(() => {
        if (!companyId) return;

        const fetchDashboardData = async () => {
            setLoading(true);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch employees and their last time entry for today
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

            // Calculate stats
            let activeEmployees = 0;
            let pausedEmployees = 0;
            const processedEmployees = employeesData.map(emp => {
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
            });

            setEmployees(processedEmployees);
            setStats(prev => ({ ...prev, activeEmployees, pausedEmployees }));
            setLoading(false);
        };

        fetchDashboardData();
    }, [companyId]);


    const summaryStats = [
        { title: 'Estado Empleados', stats: [{ value: stats.activeEmployees, label: 'Activos', color: '#6EE7B7' }, { value: stats.pausedEmployees, label: 'Pausa', color: '#FCD34D' }] },
        { title: 'Estado Autónomos', stats: [{ value: stats.activeFreelancers, label: 'Activos', color: '#6EE7B7' }] },
        { title: 'Solicitudes Pendientes', stats: [{ value: stats.pendingAbsences, label: 'Ausencias por revisar' }] },
        { title: 'Ausencias Pendientes', stats: [{ value: stats.pendingClockings, label: 'Fichajes por revisar' }] },
        { title: 'Incidencias Detectadas', stats: [{ value: stats.detectedIncidents, label: 'Fichajes por revisar' }] }
    ];

    return (
        <div className="hr-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Escritorio de Fichajes</h1>
                    <p>Un resumen del estado actual de los empleados y las solicitudes.</p>
                </div>
                <div className="header-actions">
                    <button><FiBell /></button>
                    <button><FiArrowRight /></button>
                </div>
            </header>

            <div className="summary-grid">
                {summaryStats.map((item, index) => (
                    <SummaryCard key={index} title={item.title} stats={item.stats} />
                ))}
            </div>

            <div className="details-grid">
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

                <div className="freelancer-details card">
                     <h2>Detalle de Autónomos (Activos ahora)</h2>
                     <table>
                         <thead>
                             <tr>
                                 <th>AUTÓNOMO</th>
                                 <th>ESTADO ACTUAL</th>
                                 <th>INICIO DE TAREA</th>
                             </tr>
                         </thead>
                         <tbody>
                            {freelancers.map((freelancer, index) => (
                                <tr key={index}>
                                    <td>{freelancer.name}</td>
                                    <td><span className="status-activo">{freelancer.status}</span></td>
                                    <td>{freelancer.task_start_time}</td>
                                </tr>
                            ))}
                         </tbody>
                     </table>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;