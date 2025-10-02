import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';
import './HRIncidents.css';

const HRIncidents = () => {
    const { companyId } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!companyId) return;

        const fetchIncidents = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error } = await supabase
                    .from('incidents')
                    .select(`
                        id,
                        date,
                        status,
                        description,
                        employees ( full_name ),
                        incident_types ( name )
                    `)
                    .eq('company_id', companyId)
                    .order('date', { ascending: false });

                if (error) throw error;

                const transformedData = data.map(item => ({
                    id: item.id,
                    employeeName: item.employees ? item.employees.full_name : 'Desconocido',
                    type: item.incident_types ? item.incident_types.name : 'Desconocido',
                    date: new Date(item.date).toLocaleDateString('es-ES'),
                    status: item.status,
                }));

                setIncidents(transformedData);

            } catch (error) {
                setError('No se pudieron cargar las incidencias.');
                console.error('Error fetching incidents:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
    }, [companyId]);


    if (loading) {
        return <div className="hr-panel-container"><h1>Gestión de Incidencias</h1><p>Cargando...</p></div>;
    }

    if (error) {
        return <div className="hr-panel-container"><h1>Gestión de Incidencias</h1><p className="error-message">{error}</p></div>;
    }


    return (
        <div className="hr-panel-container">
            <div className="hr-panel-header">
                <h1>Gestión de Incidencias</h1>
                <button className="hr-panel-add-btn" disabled>Registrar Incidencia</button>
            </div>
            <div className="table-container">
                <table className="hr-panel-table">
                    <thead>
                        <tr>
                            <th>Empleado</th>
                            <th>Tipo de Incidencia</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.length > 0 ? incidents.map(incident => (
                            <tr key={incident.id}>
                                <td>{incident.employeeName}</td>
                                <td>{incident.type}</td>
                                <td>{incident.date}</td>
                                <td><span className={`status status-${incident.status.toLowerCase().replace(/\s+/g, '-')}`}>{incident.status}</span></td>
                                <td>
                                    <Link to={`/hr/incidents/${incident.id}`} className="action-btn edit-btn">Ver/Editar</Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5">No hay incidencias registradas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HRIncidents;
