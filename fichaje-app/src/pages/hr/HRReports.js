import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRReports.css';

const HRReports = () => {
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [timeEntries, setTimeEntries] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    const [filters, setFilters] = useState({
        employeeId: '',
        departmentId: '',
        startDate: '',
        endDate: '',
    });
    const [loading, setLoading] =useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!companyId) return;
        const fetchData = async () => {
            const [
                { data: employeesData, error: employeesError },
                { data: departmentsData, error: departmentsError }
            ] = await Promise.all([
                supabase.from('employees').select('id, full_name').eq('company_id', companyId).neq('role', 'Super Admin').order('full_name'),
                supabase.from('departments').select('id, name').eq('company_id', companyId).order('name')
            ]);

            if (employeesError) setError('No se pudo cargar la lista de empleados.');
            else setEmployees(employeesData);

            if (departmentsError) setError('No se pudo cargar la lista de departamentos.');
            else setDepartments(departmentsData);
        };
        fetchData();
    }, [companyId]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const calculateHoursSummary = (entries) => {
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
                        if (!clockInTime) {
                            clockInTime = eventTime;
                        }
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

            // If the user is still clocked in at the end of the period, add the time until now
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

    const fetchReportData = async () => {
        if (!companyId) return;
        setLoading(true);
        setError(null);
        setTimeEntries([]);
        setSummaryData([]);

        try {
            let employeeIdsToFilter = null;

            // If a department is selected, get the employees from that department
            if (filters.departmentId) {
                const { data: departmentEmployees, error: deptError } = await supabase
                    .from('employees')
                    .select('id')
                    .eq('company_id', companyId)
                    .eq('department_id', filters.departmentId);

                if (deptError) throw new Error('No se pudieron cargar los empleados del departamento.');

                const ids = departmentEmployees.map(emp => emp.id);
                if (ids.length === 0) {
                    // No employees in this department, so no time entries to show
                    setTimeEntries([]);
                    setSummaryData([]);
                    setLoading(false);
                    return;
                }
                employeeIdsToFilter = ids;
            }

            let query = supabase.from('time_entries').select('*').eq('company_id', companyId).order('created_at', { ascending: true });

            // Handle combined employee and department filters
            if (filters.employeeId) {
                if (employeeIdsToFilter && !employeeIdsToFilter.includes(filters.employeeId)) {
                     // Employee is not in the selected department, so return empty
                    setTimeEntries([]);
                    setSummaryData([]);
                    setLoading(false);
                    return;
                }
                query = query.eq('employee_id', filters.employeeId);
            } else if (employeeIdsToFilter) {
                query = query.in('employee_id', employeeIdsToFilter);
            }

            if (filters.startDate) query = query.gte('created_at', `${filters.startDate}T00:00:00`);
            if (filters.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59`);

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw new Error('No se pudieron cargar los fichajes.');
            }

            setTimeEntries(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setSummaryData(calculateHoursSummary(data));

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hr-reports-container">
            <h1>Informes de Fichajes</h1>
            <div className="filters-container">
                 <div className="filter-group">
                    <label htmlFor="employeeId">Empleado</label>
                    <select id="employeeId" name="employeeId" value={filters.employeeId} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="departmentId">Departamento</label>
                    <select id="departmentId" name="departmentId" value={filters.departmentId} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        {departments.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="startDate">Fecha de Inicio</label>
                    <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label htmlFor="endDate">Fecha de Fin</label>
                    <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                </div>
                <button onClick={fetchReportData} className="apply-filters-btn" disabled={loading}>
                    {loading ? 'Cargando...' : 'Aplicar Filtros'}
                </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="report-content">
                {loading ? <p>Cargando datos...</p> :
                    <>
                        <section className="report-section">
                            <h2>Resumen de Horas</h2>
                            <div className="table-container">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Empleado</th>
                                            <th>Horas Totales Trabajadas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summaryData.length > 0 ? summaryData.map(s => (
                                            <tr key={s.employee_name}>
                                                <td>{s.employee_name}</td>
                                                <td>{s.totalHours.toFixed(2)}</td>
                                            </tr>
                                        )) : <tr><td colSpan="2">No hay datos para el resumen.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="report-section">
                            <h2>Fichajes Detallados</h2>
                            <div className="table-container">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha y Hora</th>
                                            <th>Empleado</th>
                                            <th>Acción</th>
                                            <th>Cliente</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeEntries.length > 0 ? timeEntries.map(entry => (
                                            <tr key={entry.id}>
                                                <td>{new Date(entry.created_at).toLocaleString('es-ES')}</td>
                                                <td>{entry.employee_name}</td>
                                                <td>{entry.action}</td>
                                                <td>{entry.client_name || 'N/A'}</td>
                                            </tr>
                                        )) : <tr><td colSpan="4">No hay datos para los filtros seleccionados.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                }
            </div>
        </div>
    );
};

export default HRReports;
