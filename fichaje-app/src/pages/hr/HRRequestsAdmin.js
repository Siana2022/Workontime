import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';
import '../Requests.css';

const HRRequestsAdmin = () => {
    const { companyId } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('Pendiente');

    const fetchRequests = async () => {
        if (!companyId) return;
        setLoading(true);
        setError('');

        let query = supabase
            .from('requests')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (filter !== 'Todas') {
            query = query.eq('status', filter);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
            console.error('Error fetching requests:', fetchError);
            setError('No se pudieron cargar las solicitudes.');
        } else {
            setRequests(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [filter, companyId]);

    const handleUpdateRequest = async (requestId, newStatus) => {
        const originalRequests = [...requests];
        const requestToUpdate = requests.find(req => req.id === requestId);

        if (!requestToUpdate) return;

        // Optimistically update UI
        const updatedRequests = requests.map(req =>
            req.id === requestId ? { ...req, status: newStatus } : req
        );
        setRequests(updatedRequests.filter(req => newStatus === 'Pendiente' || req.id !== requestId));

        // If approving a clock-in error, also create an incident
        if (newStatus === 'Aprobada' && requestToUpdate.request_type === 'Error en el fichaje') {
            try {
                const description = `Error de fichaje. Hora real: ${requestToUpdate.hora_entrada_real}, Hora fichada: ${requestToUpdate.hora_entrada_fichada}. Notas: ${requestToUpdate.comments || 'N/A'}`;

                const { data: typeData, error: typeError } = await supabase
                    .from('incident_types')
                    .select('id')
                    .eq('name', 'Error en el fichaje')
                    .eq('company_id', companyId)
                    .single();

                if (typeError || !typeData) {
                    throw new Error("No se encontró el tipo de incidencia 'Error en el fichaje'. Por favor, créalo en la configuración.");
                }

                const newIncident = {
                    employee_id: requestToUpdate.employee_id,
                    company_id: companyId,
                    incident_type_id: typeData.id,
                    date: requestToUpdate.start_date,
                    description: description,
                    status: 'Cerrada'
                };

                const { error: incidentError } = await supabase.from('incidents').insert([newIncident]);
                if (incidentError) throw incidentError;

            } catch (err) {
                console.error('Error creating incident from request:', err);
                alert(`Error al crear la incidencia: ${err.message}`);
                setRequests(originalRequests);
                return;
            }
        }

        const { error: updateError } = await supabase
            .from('requests')
            .update({ status: newStatus })
            .eq('id', requestId)
            .eq('company_id', companyId);

        if (updateError) {
            console.error('Error updating request:', updateError);
            alert('Hubo un error al actualizar la solicitud. La lista se recargará.');
            setRequests(originalRequests);
            fetchRequests();
        } else {
             if (filter !== 'Todas') {
                setRequests(currentRequests => currentRequests.filter(req => req.id !== requestId));
            } else {
                fetchRequests();
            }
        }
    };

    return (
        <div className="hr-panel-container">
            <div className="hr-panel-header">
                <h1>Gestión de Solicitudes</h1>
            </div>

            <div className="filters-container" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
                <div className="filter-group">
                    <label htmlFor="status-filter">Filtrar por estado:</label>
                    <select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option>Pendiente</option>
                        <option>Aprobada</option>
                        <option>Rechazada</option>
                        <option value="Todas">Todas</option>
                    </select>
                </div>
            </div>

            {error && <p className="error-message">{error}</p>}
            {loading && <p>Cargando solicitudes...</p>}

            {!loading && (
                 <div className="table-container">
                    <table className="hr-panel-table">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Tipo</th>
                                <th>Inicio</th>
                                <th>Fin</th>
                                <th>Comentarios</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length > 0 ? requests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.employee_name}</td>
                                    <td>{req.request_type}</td>
                                    <td>{new Date(req.start_date).toLocaleDateString()}</td>
                                    <td>{new Date(req.end_date).toLocaleDateString()}</td>
                                    <td>{req.comments}</td>
                                    <td><span className={`status status-${req.status.toLowerCase()}`}>{req.status}</span></td>
                                    <td>
                                        {req.status === 'Pendiente' && (
                                            <div className="action-buttons">
                                                <button onClick={() => handleUpdateRequest(req.id, 'Aprobada')} className="action-btn-approve">Aprobar</button>
                                                <button onClick={() => handleUpdateRequest(req.id, 'Rechazada')} className="action-btn-reject">Rechazar</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7">No hay solicitudes con el estado seleccionado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HRRequestsAdmin;