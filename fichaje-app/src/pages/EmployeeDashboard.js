import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './EmployeeDashboard.css';

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
    // Add 1 to include both start and end dates in the count
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
    const [loadingVacations, setLoadingVacations] = useState(true);

    // New state for clocking status
    const [clockingStatus, setClockingStatus] = useState('Fuera de servicio'); // Values: 'Trabajando', 'En Pausa', 'Fuera de servicio'


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

            // Fetch last time entry for today to determine initial status
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data: lastEntryData, error: lastEntryError } = await supabase
                .from('time_entries')
                .select('action')
                .eq('employee_id', user.id)
                .eq('company_id', companyId)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false })
                .limit(1);

            if (lastEntryError) {
                console.error("Error fetching last time entry:", lastEntryError);
            } else if (lastEntryData && lastEntryData.length > 0) {
                const lastAction = lastEntryData[0].action;
                if (lastAction === 'Entrada' || lastAction === 'Reanudar') {
                    setClockingStatus('Trabajando');
                } else if (lastAction === 'Pausa') {
                    setClockingStatus('En Pausa');
                } else {
                    setClockingStatus('Fuera de servicio');
                }
            }

            setLoading(false);
        };

        fetchInitialData();
        return () => clearInterval(timer);
    }, [user?.id, companyId]);

    // Effect to fetch clients if module is enabled
    useEffect(() => {
        const fetchClients = async () => {
            if (!companyId || !settings?.has_clients_module) return;

            const { data, error } = await supabase
                .from('clients')
                .select('id, name')
                .eq('company_id', companyId)
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching clients:', error);
            } else {
                setClients(data);
            }
        };

        fetchClients();
    }, [companyId, settings?.has_clients_module]);

    // Effect to calculate remaining vacation days
    useEffect(() => {
        if (user?.vacation_days) {
            setRemainingVacationDays(user.vacation_days - usedVacationDays);
        }
    }, [user?.vacation_days, usedVacationDays]);


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

            if (actionType === 'Entrada' || actionType === 'Reanudar') setClockingStatus('Trabajando');
            else if (actionType === 'Pausa') setClockingStatus('En Pausa');
            else if (actionType === 'Salida') setClockingStatus('Fuera de servicio');

            setLastClocking({ type: actionType, time: new Date(), client: entry.client_name });
        } catch (err) {
            setError('Error al guardar el fichaje. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Determine button disabled states
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
                <span className={`status-dot status-${clockingStatus.toLowerCase().replace(/\s+/g, '-')}`}></span>
                Estado: <strong>{clockingStatus}</strong>
            </div>

            <div className="dashboard-section summary-stats">
                <h3>Resumen General</h3>
                <div className="stats-grid">
                    <StatCard title="Días Totales" value={loadingVacations ? '...' : (user?.vacation_days || 0)} unit="días" />
                    <StatCard title="Días Usados" value={loadingVacations ? '...' : usedVacationDays} unit="días" />
                    <StatCard title="Días Restantes" value={loadingVacations ? '...' : remainingVacationDays} unit="días" />
                    {schedule && <StatCard title="Horario Asignado" value={schedule.name} unit={`${schedule.schedule_type} (${schedule.hours_per_week}h/sem)`} />}
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
