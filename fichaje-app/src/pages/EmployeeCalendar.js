import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { generateMonthGrid } from '../utils/calendar';
import './EmployeeCalendar.css'; // We will create this file next

const EmployeeCalendar = () => {
    const { user, companyId } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        if (!user?.id || !companyId) return;

        const fetchCalendarEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch approved requests for the current employee
                const { data: requestsData, error: requestsError } = await supabase
                    .from('requests')
                    .select('start_date, end_date, request_type')
                    .eq('employee_id', user.id)
                    .eq('status', 'Aprobada')
                    .in('request_type', ['Vacaciones', 'Asunto Personal', 'Baja Médica']);

                if (requestsError) throw requestsError;

                // Fetch company-wide holidays
                const { data: holidaysData, error: holidaysError } = await supabase
                    .from('holidays')
                    .select('name, date')
                    .eq('company_id', companyId);

                if (holidaysError) throw holidaysError;

                const absenceEvents = requestsData.map(req => ({
                    type: 'absence',
                    title: req.request_type,
                    startDate: req.start_date,
                    endDate: req.end_date,
                }));

                const holidayEvents = holidaysData.map(hol => ({
                    type: 'holiday',
                    title: hol.name,
                    startDate: hol.date,
                    endDate: hol.date,
                }));

                setEvents([...absenceEvents, ...holidayEvents]);
            } catch (err) {
                setError('No se pudieron cargar los eventos del calendario.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCalendarEvents();
    }, [user?.id, companyId, year, month]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

    return (
        <div className="employee-calendar-container">
            <div className="calendar-header">
                <h1>Mi Calendario</h1>
                <div className="navigation">
                    <button onClick={handlePrevMonth}>&lt;</button>
                    <h2>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</h2>
                    <button onClick={handleNextMonth}>&gt;</button>
                </div>
            </div>

            <div className="calendar-legend">
                <span className="legend-item legend-absence">Mis Ausencias</span>
                <span className="legend-item legend-holiday">Festivo</span>
            </div>

            {loading && <p>Cargando eventos...</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="calendar-grid-container">
                <div className="calendar-grid days-header">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <div key={day} className="day-header">{day}</div>)}
                </div>
                <div className="calendar-grid">
                    {generateMonthGrid(year, month).flat().map((dayInfo, index) => {
                        const isCurrentMonth = dayInfo.month === 'current';
                        const dayDate = isCurrentMonth ? dayInfo.date : null;

                        const eventsForDay = dayDate ? events.filter(event => {
                            const startDate = new Date(event.startDate);
                            const endDate = new Date(event.endDate);
                            const start = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
                            const end = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
                            const current = new Date(Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()));
                            return current >= start && current <= end;
                        }) : [];

                        return (
                            <div key={index} className={`calendar-day ${isCurrentMonth ? '' : 'other-month'}`}>
                                <span className="day-number">{dayInfo.day}</span>
                                <div className="events-container">
                                    {eventsForDay.map((event, i) => (
                                        <div key={i} className={`event event-${event.type}`}>
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EmployeeCalendar;
