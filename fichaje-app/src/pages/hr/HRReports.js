import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { getTheoreticalHoursForDay, calculateActualWorkedHours } from '../../utils/hours';
import './HRReports.css';

const HRReports = () => {
    const { companyId } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [timeEntries, setTimeEntries] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    const [monthlyBalanceData, setMonthlyBalanceData] = useState([]);
    const [filters, setFilters] = useState({
        employeeId: '',
        departmentId: '',
        startDate: '',
        endDate: '',
    });
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(false);
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
        // This is a complex calculation, let's use our robust one instead
        const summary = {};
        const entriesByEmployee = entries.reduce((acc, entry) => {
            if (!acc[entry.employee_id]) acc[entry.employee_id] = [];
            acc[entry.employee_id].push(entry);
            return acc;
        }, {});

        for (const empId in entriesByEmployee) {
            const employeeEntries = entriesByEmployee[empId];
            summary[empId] = {
                employee_name: employeeEntries[0].employee_name,
                totalHours: calculateActualWorkedHours(employeeEntries),
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
            if (filters.departmentId) {
                const { data: departmentEmployees, error: deptError } = await supabase
                    .from('employees').select('id').eq('company_id', companyId).eq('department_id', filters.departmentId);
                if (deptError) throw new Error('No se pudieron cargar los empleados del departamento.');
                employeeIdsToFilter = departmentEmployees.map(emp => emp.id);
                if (employeeIdsToFilter.length === 0) {
                    setLoading(false); return;
                }
            }

            let query = supabase.from('time_entries').select('*').eq('company_id', companyId);

            if (filters.employeeId) {
                if (employeeIdsToFilter && !employeeIdsToFilter.includes(filters.employeeId)) {
                    setLoading(false); return;
                }
                query = query.eq('employee_id', filters.employeeId);
            } else if (employeeIdsToFilter) {
                query = query.in('employee_id', employeeIdsToFilter);
            }

            if (filters.startDate) query = query.gte('created_at', `${filters.startDate}T00:00:00`);
            if (filters.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59`);

            const { data, error: fetchError } = await query.order('created_at', { ascending: true });
            if (fetchError) throw new Error('No se pudieron cargar los fichajes.');

            setTimeEntries(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setSummaryData(calculateHoursSummary(data));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyBalanceReport = async () => {
        if (!companyId || !year || !month) return;
        setLoadingBalance(true);
        setError(null);
        setMonthlyBalanceData([]);

        try {
            const { data: employeesWithSchedules, error: empError } = await supabase
                .from('employees').select('id, full_name, schedules(*)').eq('company_id', companyId).neq('role', 'Super Admin');
            if (empError) throw new Error('No se pudieron cargar los empleados y sus horarios.');

            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const daysInMonth = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

            const { data: entries, error: entriesError } = await supabase
                .from('time_entries').select('*').eq('company_id', companyId)
                .gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${endDate}T23:59:59`);
            if (entriesError) throw new Error('No se pudieron cargar los fichajes del mes.');

            const entriesByEmployee = entries.reduce((acc, entry) => {
                if (!acc[entry.employee_id]) acc[entry.employee_id] = [];
                acc[entry.employee_id].push(entry);
                return acc;
            }, {});

            const balanceReport = employeesWithSchedules.map(emp => {
                let totalBalance = 0;
                const employeeEntries = entriesByEmployee[emp.id] || [];
                const entriesByDay = employeeEntries.reduce((acc, entry) => {
                    const day = new Date(entry.created_at).toISOString().split('T')[0];
                    if (!acc[day]) acc[day] = [];
                    acc[day].push(entry);
                    return acc;
                }, {});

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day);
                    const dateKey = date.toISOString().split('T')[0];
                    const dailyEntries = entriesByDay[dateKey] || [];
                    const actualHours = calculateActualWorkedHours(dailyEntries);
                    const theoreticalHours = getTheoreticalHoursForDay(emp.schedules, date);
                    if (theoreticalHours > 0 || actualHours > 0) {
                        totalBalance += actualHours - theoreticalHours;
                    }
                }
                return {
                    employee_id: emp.id,
                    employee_name: emp.full_name,
                    balance: totalBalance,
                };
            });

            setMonthlyBalanceData(balanceReport);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingBalance(false);
        }
    };

    const formatBalance = (hours) => {
        if (isNaN(hours)) return 'N/A';
        const sign = hours >= 0 ? '+' : '-';
        const absoluteHours = Math.abs(hours);
        const h = Math.floor(absoluteHours);
        const m = Math.round((absoluteHours - h) * 60);
        return `${sign}${h}h ${m}m`;
    };

    return (
        <div className="hr-reports-container">
            <h1>Informes Personalizados</h1>

            <section className="report-section">
                <h2>Balance Mensual de Horas</h2>
                <div className="filters-container monthly-balance-filters">
                    <div className="filter-group">
                        <label htmlFor="month">Mes</label>
                        <select id="month" name="month" value={month} onChange={e => setMonth(e.target.value)}>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label htmlFor="year">Año</label>
                        <input type="number" id="year" name="year" value={year} onChange={e => setYear(e.target.value)} />
                    </div>
                    <button onClick={generateMonthlyBalanceReport} className="apply-filters-btn" disabled={loadingBalance}>
                        {loadingBalance ? 'Generando...' : 'Generar Balance'}
                    </button>
                </div>
                <div className="table-container">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Balance de Horas del Mes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingBalance ? <tr><td colSpan="2">Generando informe...</td></tr> :
                             monthlyBalanceData.length > 0 ? monthlyBalanceData.map(s => (
                                <tr key={s.employee_id}>
                                    <td>{s.employee_name}</td>
                                    <td className={s.balance > 0.01 ? 'positive-balance' : s.balance < -0.01 ? 'negative-balance' : ''}>
                                        {formatBalance(s.balance)}
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="2">No se ha generado el informe de balance.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="report-section">
                <h2>Informe de Horas y Fichajes por Rango</h2>
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

                {loading ? <p>Cargando datos...</p> :
                    <>
                        <section className="report-subsection">
                            <h3>Resumen de Horas por Filtro</h3>
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

                        <section className="report-subsection">
                            <h3>Fichajes Detallados</h3>
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
            </section>
        </div>
    );
};

export default HRReports;