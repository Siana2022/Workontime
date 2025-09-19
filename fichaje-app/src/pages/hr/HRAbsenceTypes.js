import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './HRPanel.css';

const AbsenceTypeForm = ({ absenceType, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState(
        absenceType || { name: '', requires_document: false, paid: false }
    );

    useEffect(() => {
        setFormData(absenceType || { name: '', requires_document: false, paid: false });
    }, [absenceType]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="form-overlay">
            <form className="employee-form" onSubmit={handleSubmit}>
                <h2>{absenceType ? 'Editar Tipo de Ausencia' : 'Añadir Tipo de Ausencia'}</h2>
                <div className="form-group">
                    <label>Nombre</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label className="checkbox-label">
                        <input type="checkbox" name="requires_document" checked={formData.requires_document || false} onChange={handleChange} disabled={isSaving} />
                        Requiere Justificante
                    </label>
                </div>
                <div className="form-group">
                    <label className="checkbox-label">
                        <input type="checkbox" name="paid" checked={formData.paid || false} onChange={handleChange} disabled={isSaving} />
                        Es Remunerada
                    </label>
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

const HRAbsenceTypes = () => {
    const { companyId } = useAuth();
    const [absenceTypes, setAbsenceTypes] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchAbsenceTypes = async () => {
        if (!companyId) return;
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('absence_types')
                .select('*')
                .eq('company_id', companyId)
                .order('name', { ascending: true });
            if (error) throw error;
            setAbsenceTypes(data);
        } catch (err) {
            setError('No se pudieron cargar los tipos de ausencia.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAbsenceTypes();
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
        if (window.confirm('¿Estás seguro de que quieres eliminar este tipo de ausencia?')) {
            try {
                const { error } = await supabase.from('absence_types').delete().eq('id', typeId).eq('company_id', companyId);
                if (error) throw error;
                fetchAbsenceTypes();
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
                const { error } = await supabase.from('absence_types').update(formData).eq('id', id).eq('company_id', companyId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('absence_types').insert([{ ...formData, company_id: companyId }]);
                if (error) throw error;
            }
            setIsFormVisible(false);
            setEditingType(null);
            fetchAbsenceTypes();
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
            {isFormVisible && <AbsenceTypeForm absenceType={editingType} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />}
            <div className="hr-panel-header">
                <h1>Tipos de Ausencia</h1>
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
                                <th>Requiere Justificante</th>
                                <th>Es Remunerada</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absenceTypes.map(type => (
                                <tr key={type.id}>
                                    <td>{type.name}</td>
                                    <td>{type.requires_document ? 'Sí' : 'No'}</td>
                                    <td>{type.paid ? 'Sí' : 'No'}</td>
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

export default HRAbsenceTypes;
