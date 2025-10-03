import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import SummaryCard from '../../components/hr/SummaryCard';
import EmployeeHistoryModal from '../../components/hr/EmployeeHistoryModal';
import { FiBell, FiLogOut } from 'react-icons/fi';
import './HRDashboard.css';

const HRDashboard = () => {
    const { companyId, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
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
                    full_name,
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

            const allEmployeesWithStatus = employeesData ? employeesData.map(emp => {
                const todaysEntries = emp.time_entries
                    .filter(e => new Date(e.created_at) >= today)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                const lastEntry = todaysEntries[0];
                let status = 'Fuera';
                let entryTime = '--:--';

                if (lastEntry) {
                    if (lastEntry.action === 'Entrada' || lastEntry.action === 'Reanudar') {
                        status = 'Activo';
                    } else if (lastEntry.action === 'Pausa') {
                        status = 'Pausa';
                    }
                    entryTime = new Date(lastEntry.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                }
                return { ...emp, status, entryTime };
            }) : [];

            const activeCount = allEmployeesWithStatus.filter(emp => emp.status === 'Activo').length;
            const totalEmployees = employeesData ? employeesData.length : 0;
            const notActiveCount = totalEmployees - activeCount;

            const workingEmployees = allEmployeesWithStatus.filter(emp => emp.status === 'Activo' || emp.status === 'Pausa');

            setEmployees(workingEmployees);
            setStats(prev => ({ ...prev, activeEmployees: activeCount, pausedEmployees: notActiveCount }));
            setLoading(false);
        };

        fetchDashboardData();
    }, [companyId]);

    const handleViewHistory = (employeeId) => {
        setSelectedEmployeeId(employeeId);
    };

    const handleCloseModal = () => {
        setSelectedEmployeeId(null);
    };

    const summaryStats = [
        { title: 'Estado Empleados', to: '/hr/employees', stats: [{ value: stats.activeEmployees, label: 'Activos', color: 'var(--status-green)' }, { value: stats.pausedEmployees, label: 'Pausa', color: 'var(--status-red)' }] },
        { title: 'Solicitudes Pendientes', to: '/hr/requests-admin', stats: [{ value: stats.pendingAbsences, label: 'Ausencias por revisar', color: 'var(--text-primary)' }] },
        { title: 'Ausencias Pendientes', to: '/hr/absences', stats: [{ value: stats.pendingClockings, label: 'Fichajes por revisar', color: 'var(--text-primary)' }] },
        { title: 'Incidencias Detectadas', to: '/hr/incidents', stats: [{ value: stats.detectedIncidents, label: 'Fichajes por revisar', color: 'var(--status-red)' }] }
    ];

    return (
        <div className="hr-dashboard">
            {selectedEmployeeId && (
                <EmployeeHistoryModal
                    employeeId={selectedEmployeeId}
                    onClose={handleCloseModal}
                />
            )}
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
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (<tr><td colSpan="4">Cargando...</td></tr>) :
                            employees.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.full_name}</td>
                                    <td><span className={`status-${emp.status.toLowerCase()}`}>{emp.status}</span></td>
                                    <td>{emp.entryTime}</td>
                                    <td>
                                        <button onClick={() => handleViewHistory(emp.id)} className="action-link-danger">
                                            Ver Historial
                                        </button>
                                    </td>
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