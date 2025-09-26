import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { generateMonthGrid } from '../../utils/calendar';
import './HRPanel.css';
import './HRGlobalCalendar.css';

const HolidayForm = ({ holiday, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState(
        holiday || { name: '', date: '' }
    );

    useEffect(() => {
        setFormData(holiday || { name: '', date: '' });
    }, [holiday]);

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
                <h2>{holiday ? 'Editar Día Festivo' : 'Añadir Día Festivo'}</h2>
                <div className="form-group">
                    <label>Nombre del Festivo</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isSaving} />
                </div>
                <div className="form-group">
                    <label>Fecha</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required disabled={isSaving} />
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


const HRHolidays = () => {
    const { companyId } = useAuth();
    const [holidays, setHolidays] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchHolidays = async () => {
        if (!companyId) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('holidays').select('*').eq('company_id', companyId).order('date', { ascending: true });
            if (error) throw error;
            setHolidays(data);
        } catch (err) {
            setError('No se pudieron cargar los días festivos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [companyId]);

    const handleAdd = () => {
        setEditingHoliday(null);
        setIsFormVisible(true);
    };

    const handleEdit = (holiday) => {
        const formattedDate = new Date(holiday.date).toISOString().split('T')[0];
        setEditingHoliday({ ...holiday, date: formattedDate });
        setIsFormVisible(true);
    };

    const handleDelete = async (holidayId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este día festivo?')) {
            try {
                const { error } = await supabase.from('holidays').delete().eq('id', holidayId).eq('company_id', companyId);
                if (error) throw error;
                fetchHolidays();
            } catch (err) {
                setError(`Error al eliminar: ${err.message}`);
            }
        }
    };

    const handleSave = async (holidayData) => {
        setIsSaving(true);
        setError('');
        const { id, ...formData } = holidayData;
        try {
            if (id) {
                const { error } = await supabase.from('holidays').update(formData).eq('id', id).eq('company_id', companyId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('holidays').insert([{ ...formData, company_id: companyId }]);
                if (error) throw error;
            }
            setIsFormVisible(false);
            setEditingHoliday(null);
            fetchHolidays();
        } catch (err) {
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingHoliday(null);
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

    // Create a set of holiday dates for efficient lookup
    const holidayDates = new Set(holidays.map(h => new Date(h.date).toISOString().split('T')[0]));

    return (
        <div className="hr-panel-container">
            {isFormVisible && <HolidayForm holiday={editingHoliday} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />}
            <div className="hr-panel-header">
                <h1>Gestión de Días Festivos</h1>
                <button onClick={handleAdd} className="hr-panel-add-btn">+ Añadir Festivo</button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="holidays-layout">
                <div className="holidays-list">
                    <h3>Listado de Festivos ({year})</h3>
                    {loading ? <p>Cargando...</p> : (
                        <ul>
                            {holidays.filter(h => new Date(h.date).getFullYear() === year).map(h => (
                                <li key={h.id}>
                                    <span>{new Date(h.date).toLocaleDateString('es-ES', {day: '2-digit', month: 'long'})} - {h.name}</span>
                                    <div>
                                        <button onClick={() => handleEdit(h)} className="action-btn-sm edit-btn">✎</button>
                                        <button onClick={() => handleDelete(h.id)} className="action-btn-sm delete-btn">🗑</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="holidays-calendar">
                    <div className="calendar-header">
                        <button onClick={handlePrevMonth}>&lt;</button>
                        <h2>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</h2>
                        <button onClick={handleNextMonth}>&gt;</button>
                    </div>
                    <div className="calendar-container">
                        <div className="calendar-grid days-header">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <div key={day} className="day-header">{day}</div>)}
                        </div>
                        <div className="calendar-grid">
                            {generateMonthGrid(year, month).flat().map((dayInfo, index) => {
                                const isCurrentMonth = dayInfo.month === 'current';
                                const dayDate = isCurrentMonth ? dayInfo.date : null;
                                const dateString = dayDate ? dayDate.toISOString().split('T')[0] : null;
                                const isHoliday = dateString && holidayDates.has(dateString);

                                return (
                                    <div key={index} className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isHoliday ? 'holiday' : ''}`}>
                                        <span className="day-number">{dayInfo.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRHolidays;
