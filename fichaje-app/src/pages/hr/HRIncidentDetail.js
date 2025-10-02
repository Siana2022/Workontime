import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';

const HRIncidentDetail = () => {
    const { incidentId } = useParams();
    const { companyId } = useAuth();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!companyId || !incidentId) return;

        const fetchIncident = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('incidents')
                    .select(`
                        *,
                        employees ( full_name ),
                        incident_types ( name )
                    `)
                    .eq('id', incidentId)
                    .eq('company_id', companyId)
                    .single();

                if (error) throw error;
                setIncident(data);
            } catch (err) {
                setError('No se pudo cargar la incidencia.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchIncident();
    }, [incidentId, companyId]);

    if (loading) return <div className="hr-panel-container"><p>Cargando incidencia...</p></div>;
    if (error) return <div className="hr-panel-container"><p className="error-message">{error}</p></div>;
    if (!incident) return <div className="hr-panel-container"><p>Incidencia no encontrada.</p></div>;

    return (
        <div className="hr-panel-container">
            <div className="hr-panel-header">
                <h1>Detalle de la Incidencia</h1>
                <Link to="/hr/incidents" className="hr-panel-add-btn" style={{ textDecoration: 'none' }}>Volver</Link>
            </div>
            <div className="card">
                <h3>{incident.incident_types?.name} - {incident.employees?.full_name}</h3>
                <p><strong>Fecha:</strong> {new Date(incident.date).toLocaleDateString('es-ES')}</p>
                <p><strong>Estado:</strong> <span className={`status status-${incident.status.toLowerCase()}`}>{incident.status}</span></p>
                <p><strong>Descripción:</strong></p>
                <p>{incident.description || 'No hay descripción.'}</p>
            </div>
        </div>
    );
};

export default HRIncidentDetail;