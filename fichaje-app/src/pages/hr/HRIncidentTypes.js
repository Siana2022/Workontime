import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';

const IncidentTypeForm = ({ incidentType, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState(
        incidentType || { name: '', description: '' }
    );

    useEffect(() => {
        setFormData(incidentType || { name: '', description: '' });
    }, [incidentType]);

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
                <h2>{incidentType ? 'Editar Tipo de Incidencia' : 'Añadir Tipo de Incidencia'}</h2>
                <div className="form-group">
                    <label>Nombre</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label>Descripción</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows="3" disabled={isSaving}></textarea>
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

const HRIncidentTypes = () => {
    const { companyId } = useAuth();
    const [incidentTypes, setIncidentTypes] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchIncidentTypes = async () => {
        if (!companyId) return;
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('incident_types')
                .select('*')
                .eq('company_id', companyId)
                .order('name', { ascending: true });
            if (error) throw error;
            setIncidentTypes(data);
        } catch (err) {
            setError('No se pudieron cargar los tipos de incidencia.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidentTypes();
    }, [companyId]);

    const handleAdd = () => {
        setEditingType(null);
        setIsFormVisible(true);
    };

    const handleEdit = (type) => {
        setEditingType(type);
        setIsFormVisible(true);
    };

    const handleDelete = async (typeId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este tipo de incidencia?')) {
            try {
                const { error } = await supabase.from('incident_types').delete().eq('id', typeId).eq('company_id', companyId);
                if (error) throw error;
                fetchIncidentTypes();
            } catch (err) {
                setError(`Error al eliminar: ${err.message}`);
            }
        }
    };

    const handleSave = async (typeData) => {
        setIsSaving(true);
        setError('');
        const { id, ...formData } = typeData;
        try {
            if (id) {
                const { error } = await supabase.from('incident_types').update(formData).eq('id', id).eq('company_id', companyId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('incident_types').insert([{ ...formData, company_id: companyId }]);
                if (error) throw error;
            }
            setIsFormVisible(false);
            setEditingType(null);
            fetchIncidentTypes();
        } catch (err) {
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingType(null);
    };

    return (
        <div className="hr-panel-container">
            {isFormVisible && <IncidentTypeForm incidentType={editingType} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />}
            <div className="hr-panel-header">
                <h1>Tipos de Incidencia</h1>
                <button onClick={handleAdd} className="hr-panel-add-btn">+ Añadir Tipo</button>
            </div>

            {loading && <p>Cargando...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && (
                <div className="table-container">
                    <table className="hr-panel-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidentTypes.map(type => (
                                <tr key={type.id}>
                                    <td>{type.name}</td>
                                    <td>{type.description}</td>
                                    <td>
                                        <button onClick={() => handleEdit(type)} className="action-btn edit-btn">Editar</button>
                                        <button onClick={() => handleDelete(type.id)} className="action-btn delete-btn">Eliminar</button>
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

export default HRIncidentTypes;
