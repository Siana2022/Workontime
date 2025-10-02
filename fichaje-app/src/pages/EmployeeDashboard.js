import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { calculateActualWorkedHours } from '../utils/hours';
import './EmployeeDashboard.css';

// Helper to format decimal hours into Hh Mm format
const formatHours = (decimalHours) => {
    if (isNaN(decimalHours)) return '0h 0m';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
};

// Simple StatCard component for displaying stats
const StatCard = ({ title, value, unit }) => (
    <div className="stat-card">
        <h3>{title}</h3>
        <p><span>{value}</span> {unit}</p>
    </div>
);

// Helper function to calculate the difference in days between two dates
const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInTime = end.getTime() - start.getTime();
    return Math.round(differenceInTime / (1000 * 3600 * 24)) + 1;
};


const EmployeeDashboard = () => {
    const { user, companyId, settings } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [schedule, setSchedule] = useState(null);
    const [lastClocking, setLastClocking] = useState(null);
    const [selectedClient, setSelectedClient] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [usedVacationDays, setUsedVacationDays] = useState(0);
    const [remainingVacationDays, setRemainingVacationDays] = useState(0);
    const [timeWorkedToday, setTimeWorkedToday] = useState(0);
    const [loadingVacations, setLoadingVacations] = useState(true);
    const [clockingStatus, setClockingStatus] = useState('Fuera de servicio');


    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const fetchInitialData = async () => {
            if (!user?.id || !companyId) return;

            setLoading(true);
            setLoadingVacations(true);

            // Fetch user's schedule
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('employees')
                .select('schedule:schedules (name, schedule_type, hours_per_week)')
                .eq('id', user.id)
                .single();
            if (scheduleError) console.error("Error fetching user's schedule:", scheduleError);
            else if (scheduleData && scheduleData.schedule) setSchedule(scheduleData.schedule);

            // Fetch approved vacation requests
            const { data: requestsData, error: requestsError } = await supabase
                .from('requests')
                .select('start_date, end_date')
                .eq('employee_id', user.id)
                .eq('request_type', 'Vacaciones')
                .eq('status', 'Aprobada')
                .eq('company_id', companyId);

            if (requestsError) console.error("Error fetching vacation requests:", requestsError);
            else {
                const totalDaysUsed = requestsData.reduce((acc, req) => acc + calculateDaysBetween(req.start_date, req.end_date), 0);
                setUsedVacationDays(totalDaysUsed);
            }
            setLoadingVacations(false);

            // Fetch all time entries for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: todayEntries, error: entriesError } = await supabase
                .from('time_entries')
                .select('*')
                .eq('employee_id', user.id)
                .eq('company_id', companyId)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: true });

            if (entriesError) {
                console.error("Error fetching today's time entries:", entriesError);
            } else if (todayEntries && todayEntries.length > 0) {
                const lastAction = todayEntries[todayEntries.length - 1].action;
                if (lastAction === 'Entrada' || lastAction === 'Reanudar') {
                    setClockingStatus('Trabajando');
                } else if (lastAction === 'Pausa') {
                    setClockingStatus('En Pausa');
                } else {
                    setClockingStatus('Fuera de servicio');
                }
                const workedHours = calculateActualWorkedHours(todayEntries);
                setTimeWorkedToday(workedHours);
            }

            setLoading(false);
        };

        fetchInitialData();
        return () => clearInterval(timer);
    }, [user?.id, companyId]);

    useEffect(() => {
        const fetchClients = async () => {
            if (!companyId || !settings?.has_clients_module) return;
            const { data, error } = await supabase
                .from('clients').select('id, name').eq('company_id', companyId).order('name', { ascending: true });
            if (error) console.error('Error fetching clients:', error);
            else setClients(data);
        };
        fetchClients();
    }, [companyId, settings?.has_clients_module]);

    useEffect(() => {
        if (user?.vacation_days) {
            setRemainingVacationDays(user.vacation_days - usedVacationDays);
        }
    }, [user?.vacation_days, usedVacationDays]);

    // Real-time timer for worked hours
    useEffect(() => {
        let interval;
        if (clockingStatus === 'Trabajando') {
            interval = setInterval(() => {
                setTimeWorkedToday(prevTime => prevTime + (1 / 3600)); // Add 1 second in hours
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [clockingStatus]);

    const recordTimeEntry = async (actionType) => {
        setLoading(true);
        setError('');
        const entry = {
            employee_id: user.id,
            employee_name: user.full_name,
            client_name: selectedClient || null,
            action: actionType,
            company_id: companyId,
        };
        try {
            const { error: insertError } = await supabase.from('time_entries').insert([entry]);
            if (insertError) throw insertError;

            // Refetch today's entries to update status and worked time
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: todayEntries, error: entriesError } = await supabase
                .from('time_entries')
                .select('*')
                .eq('employee_id', user.id)
                .eq('company_id', companyId)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: true });

            if (entriesError) {
                console.error("Error refetching today's entries:", entriesError);
            } else if (todayEntries && todayEntries.length > 0) {
                const lastAction = todayEntries[todayEntries.length - 1].action;
                if (lastAction === 'Entrada' || lastAction === 'Reanudar') setClockingStatus('Trabajando');
                else if (lastAction === 'Pausa') setClockingStatus('En Pausa');
                else setClockingStatus('Fuera de servicio');
                const workedHours = calculateActualWorkedHours(todayEntries);
                setTimeWorkedToday(workedHours);
            } else {
                setClockingStatus('Fuera de servicio');
                setTimeWorkedToday(0);
            }

            setLastClocking({ type: actionType, time: new Date(), client: entry.client_name });
        } catch (err) {
            setError('Error al guardar el fichaje. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const isClockedOut = clockingStatus === 'Fuera de servicio';
    const isWorking = clockingStatus === 'Trabajando';
    const isOnBreak = clockingStatus === 'En Pausa';

    return (
        <div className="dashboard-container">
            <h1>Escritorio de Empleado</h1>
            <h2>Bienvenido, {user?.full_name || 'Empleado'}!</h2>

            <div className="current-time">
                {currentTime.toLocaleTimeString('es-ES')}
            </div>

            <div className="status-indicator-container">
                <span className={`status-badge status-${clockingStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                    {clockingStatus}
                </span>
            </div>

            <div className="dashboard-section summary-stats">
                <h3>Resumen General</h3>
                <div className="stats-grid">
                    <StatCard title="Tiempo Trabajado Hoy" value={formatHours(timeWorkedToday)} unit="" />
                    <StatCard title="Días Totales" value={loadingVacations ? '...' : (user?.vacation_days || 0)} unit="días" />
                    <StatCard title="Días Usados" value={loadingVacations ? '...' : usedVacationDays} unit="días" />
                    <StatCard title="Días Restantes" value={loadingVacations ? '...' : remainingVacationDays} unit="días" />
                </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            {settings?.has_clients_module && (
                 <div className="client-selector">
                    <label htmlFor="client">Trabajando en:</label>
                    <select id="client" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} disabled={loading || isClockedOut}>
                        <option value="">-- Opcional --</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.name}>{client.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="dashboard-actions">
                 <button onClick={() => recordTimeEntry('Entrada')} className="action-btn clock-in" disabled={loading || !isClockedOut}>
                    {loading ? 'Guardando...' : 'Fichar Entrada'}
                </button>
                 <button onClick={() => recordTimeEntry('Pausa')} className="action-btn pause" disabled={loading || !isWorking}>
                    {loading ? '...' : 'Pausar'}
                </button>
                <button onClick={() => recordTimeEntry('Reanudar')} className="action-btn resume" disabled={loading || !isOnBreak}>
                    {loading ? '...' : 'Reanudar'}
                </button>
                <button onClick={() => recordTimeEntry('Salida')} className="action-btn clock-out" disabled={loading || isClockedOut}>
                    {loading ? 'Guardando...' : 'Fichar Salida'}
                </button>
            </div>

            {lastClocking && (
                <div className="last-clocking">
                    Última acción: <strong>{lastClocking.type}</strong> a las {lastClocking.time.toLocaleTimeString('es-ES')}
                    {lastClocking.client && ` (Cliente: ${lastClocking.client})`}
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;