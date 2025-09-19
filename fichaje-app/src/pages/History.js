import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './History.css';

const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const formatDuration = (milliseconds) => {
    if (isNaN(milliseconds) || milliseconds < 0) return '0h 0m 0s';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
};

const processTimeEntries = (entries) => {
    if (!entries || entries.length === 0) return [];

    const groupedByDate = entries.reduce((acc, entry) => {
        const date = new Date(entry.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
    }, {});

    return Object.entries(groupedByDate).map(([date, dailyEntries]) => {
        // Sort entries chronologically for the day
        dailyEntries.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const clockInEntry = dailyEntries.find(e => e.action === 'Entrada');
        const clockOutEntries = dailyEntries.filter(e => e.action === 'Salida');
        const clockOutEntry = clockOutEntries[clockOutEntries.length - 1]; // Last clock-out

        const clockInTime = clockInEntry ? new Date(clockInEntry.created_at) : null;
        const clockOutTime = clockOutEntry ? new Date(clockOutEntry.created_at) : null;

        let totalDuration = 0;
        if (clockInTime && clockOutTime) {
            totalDuration = clockOutTime - clockInTime;
            // Note: This simple calculation doesn't account for pauses.
            // A more complex implementation would subtract pause durations.
        }

        return {
            id: date, // Use date as a unique key for the row
            date: date,
            clockIn: clockInTime ? formatTime(clockInTime) : '---',
            clockOut: clockOutTime ? formatTime(clockOutTime) : '---',
            total: clockInTime && clockOutTime ? formatDuration(totalDuration) : 'En curso',
        };
    });
};


const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user.id) return;

            try {
                setLoading(true);
                setError(null);
                const { data, error } = await supabase
                    .from('time_entries')
                    .select('*')
                    .eq('employee_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const processedHistory = processTimeEntries(data);
                setHistory(processedHistory);

            } catch (error) {
                setError('No se pudo cargar el historial.');
                console.error('Error fetching history:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user.id]);

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
                    </tr>
                </thead>
                <tbody>
                    {history.length > 0 ? history.map(record => (
                        <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>{record.clockIn}</td>
                            <td>{record.clockOut}</td>
                            <td>{record.total}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4">No hay registros de fichajes.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default History;
