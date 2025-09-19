import React, { useState, useEffect } from 'react';
import './ScheduleDetailsEditor.css';

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ScheduleDetailsEditor = ({ details, onChange, disabled }) => {
    const [schedule, setSchedule] = useState(details || {});

    useEffect(() => {
        // If the details prop changes from the parent, update the internal state
        setSchedule(details || {});
    }, [details]);

    const handleDayChange = (day, value) => {
        const newSchedule = { ...schedule, [day]: value };
        setSchedule(newSchedule);
        onChange(newSchedule); // Propagate changes to the parent component
    };

    return (
        <div className="schedule-details-editor">
            <h4>Definir Horario Específico</h4>
            <div className="schedule-grid">
                {daysOfWeek.map(day => (
                    <div key={day} className="day-row">
                        <label htmlFor={`schedule-${day}`}>{day}</label>
                        <input
                            type="text"
                            id={`schedule-${day}`}
                            placeholder="Ej: 09:00-13:00, 14:00-18:00"
                            value={schedule[day] || ''}
                            onChange={(e) => handleDayChange(day, e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleDetailsEditor;
