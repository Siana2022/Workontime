import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './Requests.css';

const Requests = () => {
    const { user } = useAuth();
    const [requestType, setRequestType] = useState('Vacaciones');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [comments, setComments] = useState('');

    const [pastRequests, setPastRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchRequests = async () => {
        if (!user.id) return;
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('employee_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching requests:', error);
            setError('No se pudieron cargar las solicitudes anteriores.');
        } else {
            setPastRequests(data);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            setError('Las fechas de inicio y fin son obligatorias.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        const newRequest = {
            employee_id: user.id,
            employee_name: user.name,
            request_type: requestType,
            start_date: startDate,
            end_date: endDate,
            comments: comments,
            status: 'Pendiente',
        };

        const { error: insertError } = await supabase.from('requests').insert([newRequest]);

        if (insertError) {
            setError('Error al enviar la solicitud.');
            console.error('Error inserting request:', insertError);
        } else {
            setSuccess('¡Solicitud enviada con éxito!');
            // Reset form
            setRequestType('Vacaciones');
            setStartDate('');
            setEndDate('');
            setComments('');
            // Refresh list
            fetchRequests();
        }
        setLoading(false);
    };

    return (
        <div className="requests-container">
            <h1>Solicitudes</h1>
            <div className="new-request-form">
                <h2>Nueva Solicitud</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    <div className="form-group">
                        <label htmlFor="request-type">Tipo de Ausencia</label>
                        <select id="request-type" value={requestType} onChange={(e) => setRequestType(e.target.value)} disabled={loading}>
                            <option>Vacaciones</option>
                            <option>Asunto Personal</option>
                            <option>Baja Médica</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="start-date">Fecha de Inicio</label>
                        <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end-date">Fecha de Fin</label>
                        <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="comments">Comentarios</label>
                        <textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} rows="4" disabled={loading}></textarea>
                    </div>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>
            </div>

            <div className="existing-requests">
                <h2>Mis Solicitudes</h2>
                <table className="requests-table">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pastRequests.length > 0 ? (
                            pastRequests.map(req => (
                                <tr key={req.id}>
                                    <td>{req.request_type}</td>
                                    <td>{req.start_date}</td>
                                    <td>{req.end_date}</td>
                                    <td><span className={`status status-${req.status.toLowerCase()}`}>{req.status}</span></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4">No has enviado ninguna solicitud todavía.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Requests;
