import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ScheduleDetailsEditor from '../../components/hr/ScheduleDetailsEditor';
import './HRPanel.css';

const ScheduleTypeForm = ({ scheduleType, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState(
        scheduleType || { name: '', hours_per_week: 40, schedule_type: 'Abierto', details: null }
    );

    useEffect(() => {
        if (scheduleType) {
            setFormData(scheduleType);
        } else {
            setFormData({ name: '', hours_per_week: 40, schedule_type: 'Abierto', details: null });
        }
    }, [scheduleType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        if (name === 'schedule_type' && value !== 'Específico') {
            newFormData.details = null;
        }

        setFormData(newFormData);
    };

    const handleDetailsChange = (newDetails) => {
        setFormData(prev => ({ ...prev, details: newDetails }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="form-overlay">
            <form className="employee-form" onSubmit={handleSubmit}>
                <h2>{scheduleType ? 'Editar Tipo de Horario' : 'Añadir Tipo de Horario'}</h2>
                <div className="form-group">
                    <label htmlFor="schedule-name">Nombre del Horario</label>
                    <input type="text" id="schedule-name" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label htmlFor="schedule-hours">Horas por Semana</label>
                    <input type="number" id="schedule-hours" name="hours_per_week" value={formData.hours_per_week || 40} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label htmlFor="schedule-type">Tipo de Horario</label>
                    <select id="schedule-type" name="schedule_type" value={formData.schedule_type || 'Abierto'} onChange={handleChange} disabled={isSaving}>
                        <option value="Abierto">Abierto</option>
                        <option value="Específico">Específico</option>
                    </select>
                </div>

                {formData.schedule_type === 'Específico' && (
                    <ScheduleDetailsEditor
                        details={formData.details}
                        onChange={handleDetailsChange}
                        disabled={isSaving}
                    />
                )}

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

const HRScheduleTypes = () => {
    const { companyId } = useAuth();
    const [scheduleTypes, setScheduleTypes] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchSchedules = async () => {
        if (!companyId) return;
        setLoading(true);
        setError('');
        const { data, error } = await supabase.from('schedules').select('*').eq('company_id', companyId).order('name', { ascending: true });
        if (error) {
            setError('No se pudieron cargar los tipos de horario.');
        } else {
            setScheduleTypes(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSchedules();
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
        if (window.confirm('¿Estás seguro de que quieres eliminar este tipo de horario?')) {
            const { error } = await supabase.from('schedules').delete().eq('id', typeId).eq('company_id', companyId);
            if (error) {
                setError(`Error al eliminar: ${error.message}`);
            } else {
                await fetchSchedules();
            }
        }
    };

    const handleSave = async (typeData) => {
        setIsSaving(true);
        setError('');
        const { id, ...scheduleData } = typeData;

        if (scheduleData.schedule_type !== 'Específico' || (scheduleData.details && Object.keys(scheduleData.details).length === 0)) {
            scheduleData.details = null;
        }

        try {
            if (id) {
                const { error } = await supabase.from('schedules').update(scheduleData).eq('id', id).eq('company_id', companyId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('schedules').insert([{ ...scheduleData, company_id: companyId }]);
                if (error) throw error;
            }
            setIsFormVisible(false);
            setEditingType(null);
            await fetchSchedules();
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
            {isFormVisible && <ScheduleTypeForm scheduleType={editingType} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />}
            <div className="hr-panel-header">
                <h1>Gestión de Tipos de Horario</h1>
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
                                <th>Tipo</th>
                                <th>Horas Semanales</th>
                                <th>Detalles del Horario</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scheduleTypes.map(type => (
                                <tr key={type.id}>
                                    <td>{type.name}</td>
                                    <td>{type.schedule_type}</td>
                                    <td>{type.hours_per_week}</td>
                                    <td className="schedule-details-cell">
                                        {type.schedule_type === 'Específico' && type.details
                                            ? Object.entries(type.details)
                                                .filter(([, hours]) => hours)
                                                .map(([day, hours]) => <div key={day}><strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong> {hours}</div>)
                                            : 'N/A'}
                                    </td>
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

export default HRScheduleTypes;
