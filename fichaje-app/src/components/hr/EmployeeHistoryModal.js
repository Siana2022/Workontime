import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './EmployeeHistoryModal.css';

const EmployeeHistoryModal = ({ employeeId, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [employeeName, setEmployeeName] = useState('');

    useEffect(() => {
        if (!employeeId) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError('');

            // Get employee name
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('full_name')
                .eq('id', employeeId)
                .single();

            if (employeeError) {
                setError('No se pudo cargar el nombre del empleado.');
                setLoading(false);
                return;
            }
            setEmployeeName(employeeData.full_name);

            // Get last 30 days of time entries
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error: historyError } = await supabase
                .from('time_entries')
                .select('created_at, action')
                .eq('employee_id', employeeId)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (historyError) {
                setError('No se pudo cargar el historial de fichajes.');
                console.error('Error fetching history:', historyError);
            } else {
                setHistory(data);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [employeeId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>Historial de Fichajes de {employeeName}</h2>
                <p>Últimos 30 días</p>

                {loading && <p>Cargando...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && history.length === 0 && (
                    <p>No hay registros en los últimos 30 días.</p>
                )}

                {!loading && !error && history.length > 0 && (
                    <div className="history-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((entry, index) => {
                                    const entryDate = new Date(entry.created_at);
                                    return (
                                        <tr key={index}>
                                            <td>{entryDate.toLocaleDateString('es-ES')}</td>
                                            <td>{entryDate.toLocaleTimeString('es-ES')}</td>
                                            <td>{entry.action}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeHistoryModal;