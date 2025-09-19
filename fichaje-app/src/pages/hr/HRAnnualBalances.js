import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';

const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInTime = end.getTime() - start.getTime();
    return Math.round(differenceInTime / (1000 * 3600 * 24)) + 1;
};

const HRAnnualBalances = () => {
    const { companyId } = useAuth();
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!companyId) return;

        const fetchBalances = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: employees, error: employeesError } = await supabase
                    .from('employees')
                    .select('id, full_name, vacation_days')
                    .eq('company_id', companyId)
                    .neq('role', 'Super Admin');
                if (employeesError) throw employeesError;

                const { data: requests, error: requestsError } = await supabase
                    .from('requests')
                    .select('employee_id, start_date, end_date')
                    .eq('company_id', companyId)
                    .eq('request_type', 'Vacaciones')
                    .eq('status', 'Aprobada');
                if (requestsError) throw requestsError;

                const balancesData = employees.map(employee => {
                    const daysTaken = requests
                        .filter(req => req.employee_id === employee.id)
                        .reduce((acc, req) => acc + calculateDaysBetween(req.start_date, req.end_date), 0);

                    const remainingDays = (employee.vacation_days || 0) - daysTaken;

                    return {
                        id: employee.id,
                        employeeName: employee.full_name,
                        totalDays: employee.vacation_days || 0,
                        daysTaken,
                        remainingDays,
                    };
                });

                setBalances(balancesData.sort((a, b) => a.employeeName.localeCompare(b.employeeName)));

            } catch (err) {
                setError('No se pudieron cargar los saldos anuales.');
                console.error('Error fetching annual balances:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBalances();
    }, [companyId]);

    if (loading) {
        return <div className="hr-panel-container"><h1>Saldos Anuales de Vacaciones</h1><p>Cargando...</p></div>;
    }

    if (error) {
        return <div className="hr-panel-container"><h1>Saldos Anuales de Vacaciones</h1><p className="error-message">{error}</p></div>;
    }

    return (
        <div className="hr-panel-container">
            <div className="hr-panel-header">
                <h1>Saldos Anuales de Vacaciones</h1>
            </div>
            <div className="table-container">
                <table className="hr-panel-table">
                    <thead>
                        <tr>
                            <th>Empleado</th>
                            <th>Días Totales</th>
                            <th>Días Disfrutados</th>
                            <th>Días Pendientes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {balances.map(balance => (
                            <tr key={balance.id}>
                                <td>{balance.employeeName}</td>
                                <td>{balance.totalDays}</td>
                                <td>{balance.daysTaken}</td>
                                <td><strong>{balance.remainingDays}</strong></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HRAnnualBalances;
