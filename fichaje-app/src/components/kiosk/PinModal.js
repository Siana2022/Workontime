import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './PinModal.css';

const PinModal = ({ employee, onClose, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAction = async (actionType) => {
        setLoading(true);
        setError('');

        // Step 1: Verify the PIN.
        // NOTE: In a real-world scenario, you would NOT fetch the PIN to the client.
        // This check would be done in a secure backend function.
        // For this prototype, we are checking against the PIN passed in the employee object.
        if (employee.pin !== pin) {
            setError('PIN incorrecto.');
            setLoading(false);
            return;
        }

        // Step 2: Record the time entry if PIN is correct.
        const entry = {
            employee_id: employee.id,
            employee_name: employee.name,
            client_name: null, // Client is not selected in Kiosk mode
            action: actionType,
        };

        const { error: insertError } = await supabase.from('time_entries').insert([entry]);

        if (insertError) {
            setError('Error al guardar el fichaje.');
            console.error('Error inserting time entry:', insertError);
            setLoading(false);
        } else {
            // Call the onSuccess callback passed from the parent Kiosk component
            onSuccess({ name: employee.name, type: actionType, time: new Date() });
            // The modal will be closed by the parent component
        }
        // No need to setLoading(false) on success because the component will unmount.
    };

    return (
        <div className="pin-modal-overlay" onClick={onClose}>
            <div className="pin-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <img
                    src={employee.avatar_url || `https://i.pravatar.cc/150?u=${employee.id}`}
                    alt={employee.name}
                    className="modal-avatar"
                />
                <h2>{employee.name}</h2>
                <p>Introduce tu PIN para continuar</p>

                <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength="4"
                    className="pin-input"
                    autoFocus
                    disabled={loading}
                />

                {error && <p className="error-message">{error}</p>}

                <div className="modal-actions">
                    <button onClick={() => handleAction('Entrada')} className="action-btn clock-in" disabled={loading}>
                        {loading ? '...' : 'Entrada'}
                    </button>
                    <button onClick={() => handleAction('Pausa')} className="action-btn pause" disabled={loading}>
                        {loading ? '...' : 'Pausa'}
                    </button>
                    <button onClick={() => handleAction('Salida')} className="action-btn clock-out" disabled={loading}>
                        {loading ? '...' : 'Salida'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinModal;
