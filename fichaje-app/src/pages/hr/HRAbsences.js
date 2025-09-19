import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';

const HRAbsences = () => {
    const { companyId } = useAuth();
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!companyId) return;

        const fetchAbsences = async () => {
            try {
                setLoading(true);
                setError(null);
                const { data, error } = await supabase
                    .from('requests')
                    .select('*')
                    .eq('company_id', companyId)
                    .order('start_date', { ascending: false });

                if (error) throw error;

                setAbsences(data);
            } catch (error) {
                setError('No se pudieron cargar las ausencias.');
                console.error('Error fetching absences:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAbsences();
    }, [companyId]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    if (loading) {
        return <div className="hr-panel-container"><h1>Gestión de Ausencias</h1><p>Cargando...</p></div>;
    }

    if (error) {
        return <div className="hr-panel-container"><h1>Gestión de Ausencias</h1><p className="error-message">{error}</p></div>;
    }

    return (
        <div className="hr-panel-container">
            <div className="hr-panel-header">
                <h1>Gestión de Ausencias</h1>
                <button className="hr-panel-add-btn" disabled>Registrar Ausencia</button>
            </div>
            <div className="table-container">
                <table className="hr-panel-table">
                    <thead>
                        <tr>
                            <th>Empleado</th>
                            <th>Tipo de Ausencia</th>
                            <th>Fecha de Inicio</th>
                            <th>Fecha de Fin</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {absences.length > 0 ? absences.map(absence => (
                            <tr key={absence.id}>
                                <td>{absence.employee_name}</td>
                                <td>{absence.request_type}</td>
                                <td>{formatDate(absence.start_date)}</td>
                                <td>{formatDate(absence.end_date)}</td>
                                <td><span className={`status status-${absence.status.toLowerCase()}`}>{absence.status}</span></td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5">No hay ausencias registradas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HRAbsences;
