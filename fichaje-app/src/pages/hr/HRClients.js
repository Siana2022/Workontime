import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';

const ClientForm = ({ client, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState(
        client || { name: '', contact_person: '', contact_email: '' }
    );

    useEffect(() => {
        if (client) {
            setFormData(client);
        } else {
            setFormData({ name: '', contact_person: '', contact_email: '' });
        }
    }, [client]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="form-overlay">
            <form className="employee-form" onSubmit={handleSubmit}>
                <h2>{client ? 'Editar Cliente' : 'Añadir Cliente'}</h2>
                <div className="form-group">
                    <label>Nombre de la Empresa</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label>Persona de Contacto</label>
                    <input type="text" name="contact_person" value={formData.contact_person || ''} onChange={handleChange} disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label>Email de Contacto</label>
                    <input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange} disabled={isSaving} />
                </div>
                <div className="form-actions">
                    <button type="submit" className="action-btn edit-btn" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

const HRClients = () => {
    const { companyId, settings } = useAuth();
    const [clients, setClients] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchClients = async () => {
        if (!companyId) return;
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase.from('clients').select('*').eq('company_id', companyId).order('name', { ascending: true });
            if (error) throw error;
            setClients(data);
        } catch (err) {
            setError('No se pudieron cargar los clientes.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (settings?.has_clients_module) {
            fetchClients();
        } else {
            setLoading(false);
        }
    }, [companyId, settings]);

    const handleAdd = () => {
        setEditingClient(null);
        setIsFormVisible(true);
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setIsFormVisible(true);
    };

    const handleDelete = async (clientId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            try {
                const { error } = await supabase.from('clients').delete().eq('id', clientId).eq('company_id', companyId);
                if (error) throw error;
                fetchClients();
            } catch (err) {
                setError(`Error al eliminar: ${err.message}`);
            }
        }
    };

    const handleSave = async (clientData) => {
        setIsSaving(true);
        const { id, ...formData } = clientData;
        try {
            let error;
            if (id) {
                const { error: updateError } = await supabase.from('clients').update(formData).eq('id', id).eq('company_id', companyId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('clients').insert([{ ...formData, company_id: companyId }]);
                error = insertError;
            }
            if (error) throw error;
            setIsFormVisible(false);
            setEditingClient(null);
            fetchClients();
        } catch (err) {
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingClient(null);
    };

    if (!settings?.has_clients_module) {
        return (
            <div className="hr-panel-container">
                <h1>Gestión de Clientes</h1>
                <p>Este módulo no está activado para su empresa.</p>
            </div>
        );
    }

    return (
        <div className="hr-panel-container">
            {isFormVisible && <ClientForm client={editingClient} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />}
            <div className="hr-panel-header">
                <h1>Gestión de Clientes</h1>
                <button onClick={handleAdd} className="hr-panel-add-btn">+ Añadir Cliente</button>
            </div>

            {loading && <p>Cargando...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && (
                <div className="table-container">
                    <table className="hr-panel-table">
                        <thead>
                            <tr>
                                <th>Nombre Cliente</th>
                                <th>Contacto</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id}>
                                    <td>{client.name}</td>
                                    <td>{client.contact_person}</td>
                                    <td>{client.contact_email}</td>
                                    <td>
                                        <button onClick={() => handleEdit(client)} className="action-btn edit-btn">Editar</button>
                                        <button onClick={() => handleDelete(client.id)} className="action-btn delete-btn">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HRClients;
