import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRReports.css'; // Reusing styles from the main reports page

const HRClientReports = () => {
    const { companyId, settings } = useAuth();
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!companyId || !settings?.has_clients_module) return;

        const fetchClients = async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name')
                .eq('company_id', companyId)
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching clients:', error);
                setError('No se pudo cargar la lista de clientes.');
            } else {
                setClients(data);
            }
        };
        fetchClients();
    }, [companyId, settings]);

    const calculateHours = (entries) => {
        if (!entries || entries.length === 0) return [];

        const summary = {};

        const entriesByEmployee = entries.reduce((acc, entry) => {
            if (!acc[entry.employee_id]) {
                acc[entry.employee_id] = [];
            }
            acc[entry.employee_id].push(entry);
            return acc;
        }, {});

        for (const empId in entriesByEmployee) {
            const employeeEntries = entriesByEmployee[empId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            let totalMillis = 0;
            let sessionMillis = 0;
            let clockInTime = null;
            let pauseStartTime = null;

            for (const entry of employeeEntries) {
                const eventTime = new Date(entry.created_at);

                switch(entry.action) {
                    case 'Entrada':
                        if (!clockInTime) clockInTime = eventTime;
                        break;
                    case 'Pausa':
                        if (clockInTime && !pauseStartTime) {
                            sessionMillis += eventTime - clockInTime;
                            pauseStartTime = eventTime;
                            clockInTime = null;
                        }
                        break;
                    case 'Reanudar':
                        if (pauseStartTime) {
                            pauseStartTime = null;
                            clockInTime = eventTime;
                        }
                        break;
                    case 'Salida':
                        if (clockInTime) {
                            sessionMillis += eventTime - clockInTime;
                            clockInTime = null;
                        }
                        totalMillis += sessionMillis;
                        sessionMillis = 0;
                        pauseStartTime = null;
                        break;
                    default:
                        break;
                }
            }

            if (clockInTime) {
                sessionMillis += new Date() - clockInTime;
                totalMillis += sessionMillis;
            }

            summary[empId] = {
                employee_name: employeeEntries[0].employee_name,
                totalHours: totalMillis / (1000 * 60 * 60),
            };
        }
        return Object.values(summary);
    };

    const handleGenerateReport = async () => {
        if (!selectedClient || !companyId) {
            setError('Por favor, selecciona un cliente.');
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);

        const { data, error: fetchError } = await supabase
            .from('time_entries')
            .select('*')
            .eq('company_id', companyId)
            .eq('client_name', selectedClient)
            .order('created_at', { ascending: true });

        if (fetchError) {
            setError('No se pudieron cargar los datos del cliente.');
        } else {
            const employeeBreakdown = calculateHours(data);
            const totalHours = employeeBreakdown.reduce((acc, emp) => acc + emp.totalHours, 0);
            setReportData({ totalHours, employeeBreakdown });
        }
        setLoading(false);
    };

    if (!settings?.has_clients_module) {
        return (
            <div className="hr-panel-container">
                <h1>Informe por Cliente</h1>
                <p>Este módulo no está activado para su empresa.</p>
            </div>
        );
    }

    return (
        <div className="hr-panel-container">
            <h1>Informe por Cliente</h1>
            <div className="filters-container">
                <div className="filter-group">
                    <label htmlFor="client-select">Cliente</label>
                    <select id="client-select" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                        <option value="">-- Selecciona un cliente --</option>
                        {clients.map(client => <option key={client.id} value={client.name}>{client.name}</option>)}
                    </select>
                </div>
                <button onClick={handleGenerateReport} className="apply-filters-btn" disabled={loading || !selectedClient}>
                    {loading ? 'Generando...' : 'Generar Informe'}
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            {reportData && (
                <div className="report-content">
                    <section className="report-section">
                        <h2>Resumen para: <strong>{selectedClient}</strong></h2>
                        <div className="client-summary-total">
                            Horas Totales Dedicadas: <span>{reportData.totalHours.toFixed(2)}</span>
                        </div>
                    </section>
                    <section className="report-section">
                        <h2>Desglose por Empleado</h2>
                        <div className="table-container">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Horas Contribuidas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.employeeBreakdown.length > 0 ? (
                                        reportData.employeeBreakdown.map(emp => (
                                            <tr key={emp.employee_name}>
                                                <td>{emp.employee_name}</td>
                                                <td>{emp.totalHours.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="2">No hay datos para este cliente.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default HRClientReports;
