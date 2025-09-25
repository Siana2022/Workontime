import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { getTheoreticalHoursForDay, calculateActualWorkedHours } from '../utils/hours';
import './History.css';

const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const formatDuration = (hours) => {
    if (isNaN(hours) || hours < 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
};

const formatBalance = (hours) => {
    if (isNaN(hours)) return 'N/A';
    const sign = hours >= 0 ? '+' : '-';
    const absoluteHours = Math.abs(hours);
    const h = Math.floor(absoluteHours);
    const m = Math.round((absoluteHours - h) * 60);
    return `${sign}${h}h ${m}m`;
};

const processTimeEntries = (entries, schedule) => {
    if (!entries || entries.length === 0) return [];

    const sortedEntries = entries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const shifts = [];
    let i = 0;
    while (i < sortedEntries.length) {
        const currentEntry = sortedEntries[i];
        const nextEntry = sortedEntries[i + 1];

        let shift = {};

        if (currentEntry.action === 'Entrada') {
            if (nextEntry && nextEntry.action === 'Salida') {
                shift = { clockInEntry: currentEntry, clockOutEntry: nextEntry };
                i += 2;
            } else {
                shift = { clockInEntry: currentEntry, clockOutEntry: null };
                i += 1;
            }
        } else {
            shift = { clockInEntry: null, clockOutEntry: currentEntry };
            i += 1;
        }

        const { clockInEntry, clockOutEntry } = shift;
        const referenceEntry = clockInEntry || clockOutEntry;
        if (!referenceEntry) continue;

        const date = new Date(referenceEntry.created_at);
        const displayDate = date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

        const shiftEntriesForCalc = [];
        if (clockInEntry) shiftEntriesForCalc.push(clockInEntry);
        if (clockOutEntry) shiftEntriesForCalc.push(clockOutEntry);

        const actualHours = calculateActualWorkedHours(shiftEntriesForCalc);
        const theoreticalHours = getTheoreticalHoursForDay(schedule, date);
        const balance = (theoreticalHours > 0 || actualHours > 0) ? actualHours - theoreticalHours : 0;
        const sourceType = clockInEntry?.source || clockOutEntry?.source || '';

        shifts.push({
            id: `${clockInEntry?.id || 'in'}-${clockOutEntry?.id || 'out'}`,
            date: displayDate,
            clockIn: clockInEntry ? formatTime(clockInEntry.created_at) : '---',
            clockOut: clockOutEntry ? formatTime(clockOutEntry.created_at) : '---',
            total: formatDuration(actualHours),
            balance: theoreticalHours > 0 ? formatBalance(balance) : 'N/A',
            balanceHours: balance,
            source: sourceType,
            sortDate: date,
        });
    }

    return shifts.sort((a, b) => b.sortDate - a.sortDate);
};


const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                setError(null);

                const [timeEntriesRes, employeeRes] = await Promise.all([
                    supabase
                        .from('time_entries')
                        .select('*')
                        .eq('employee_id', user.id)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('employees')
                        .select('schedules(*)')
                        .eq('id', user.id)
                        .single()
                ]);

                if (timeEntriesRes.error) throw timeEntriesRes.error;
                if (employeeRes.error) throw employeeRes.error;

                const schedule = employeeRes.data?.schedules;
                const processedHistory = processTimeEntries(timeEntriesRes.data, schedule);
                setHistory(processedHistory);

            } catch (error) {
                setError('No se pudo cargar el historial.');
                console.error('Error fetching history:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user?.id]);

    if (loading) {
        return <div className="history-container"><h1>Historial de Fichajes</h1><p>Cargando...</p></div>;
    }

    if (error) {
        return <div className="history-container"><h1>Historial de Fichajes</h1><p className="error-message">{error}</p></div>;
    }

    return (
        <div className="history-container">
            <h1>Historial de Fichajes</h1>
            <table className="history-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Total Horas</th>
                        <th>Balance</th>
                        <th>Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    {history.length > 0 ? history.map(record => (
                        <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>{record.clockIn}</td>
                            <td>{record.clockOut}</td>
                            <td>{record.total}</td>
                            <td className={record.balanceHours > 0.01 ? 'positive-balance' : record.balanceHours < -0.01 ? 'negative-balance' : ''}>
                                {record.balance}
                            </td>
                            <td>{record.source}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6">No hay registros de fichajes.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default History;