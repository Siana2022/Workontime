import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './Requests.css';

const Requests = () => {
    const { user, companyId } = useAuth();
    const [requestType, setRequestType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [comments, setComments] = useState('');
    const [attachment, setAttachment] = useState(null);

    // New state for clock-in error fields
    const [errorDate, setErrorDate] = useState('');
    const [actualTime, setActualTime] = useState('');
    const [clockedTime, setClockedTime] = useState('');

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

        if (requestType === 'Error en el fichaje') {
            if (!errorDate || !actualTime || !clockedTime) {
                setError('Para un error de fichaje, todos los campos de fecha y hora son obligatorios.');
                return;
            }
        } else if (requestType !== '' && (!startDate || !endDate)) {
            setError('Las fechas de inicio y fin son obligatorias.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        let attachmentUrl = null;

        if (requestType === 'Baja Médica' && attachment) {
            const fileExt = attachment.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `justificantes/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('justificantes')
                .upload(filePath, attachment);

            if (uploadError) {
                setError('Error al subir el justificante. Por favor, inténtalo de nuevo.');
                console.error('Error uploading file:', uploadError);
                setLoading(false);
                return;
            }

            const { data } = supabase.storage.from('justificantes').getPublicUrl(filePath);
            attachmentUrl = data.publicUrl;
        }

        const newRequest = {
            employee_id: user.id,
            company_id: companyId,
            employee_name: user.full_name,
            request_type: requestType,
            comments: comments,
            status: 'Pendiente',
        };

        if (attachmentUrl) {
            newRequest.attachment_url = attachmentUrl;
        }

        if (requestType === 'Error en el fichaje') {
            newRequest.start_date = errorDate;
            newRequest.end_date = errorDate;
            newRequest.fecha_solicitud = errorDate;
            newRequest.hora_entrada_real = actualTime;
            newRequest.hora_entrada_fichada = clockedTime;
        } else {
            newRequest.start_date = startDate;
            newRequest.end_date = endDate;
        }

        const { error: insertError } = await supabase.from('requests').insert([newRequest]);

        if (insertError) {
            setError('Error al enviar la solicitud.');
            console.error('Error inserting request:', insertError);
        } else {
            setSuccess('¡Solicitud enviada con éxito!');
            setRequestType('');
            setStartDate('');
            setEndDate('');
            setComments('');
            setAttachment(null);
            setErrorDate('');
            setActualTime('');
            setClockedTime('');
            const attachmentInput = document.getElementById('attachment');
            if (attachmentInput) attachmentInput.value = '';
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
                        <label htmlFor="request-type">Tipo de Solicitud</label>
                        <select id="request-type" value={requestType} onChange={(e) => setRequestType(e.target.value)} required disabled={loading}>
                            <option value="" disabled>Selecciona un tipo</option>
                            <option>Vacaciones</option>
                            <option>Asunto Personal</option>
                            <option>Baja Médica</option>
                            <option>Error en el fichaje</option>
                            <option>Solicitud cambio de horario</option>
                        </select>
                    </div>

                    {requestType === 'Baja Médica' && (
                        <div className="form-group">
                            <label htmlFor="attachment">Adjuntar Justificante</label>
                            <input type="file" id="attachment" onChange={(e) => setAttachment(e.target.files[0])} disabled={loading} />
                        </div>
                    )}

                    {requestType === 'Error en el fichaje' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="error-date">Fecha del Error</label>
                                <input type="date" id="error-date" value={errorDate} onChange={(e) => setErrorDate(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="actual-time">Hora de Entrada Real</label>
                                <input type="time" id="actual-time" value={actualTime} onChange={(e) => setActualTime(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="clocked-time">Hora de Entrada Fichada</label>
                                <input type="time" id="clocked-time" value={clockedTime} onChange={(e) => setClockedTime(e.target.value)} required disabled={loading} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="start-date">Fecha de Inicio</label>
                                <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="end-date">Fecha de Fin</label>
                                <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required disabled={loading} />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="comments">Comentarios Adicionales</label>
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
                            <th>Justificante</th>
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
                                    <td>
                                        {req.attachment_url ? (
                                            <a href={req.attachment_url} target="_blank" rel="noopener noreferrer">Ver</a>
                                        ) : (
                                            'N/A'
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5">No has enviado ninguna solicitud todavía.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Requests;