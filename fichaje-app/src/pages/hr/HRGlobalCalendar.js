import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { generateMonthGrid } from '../../utils/calendar';
import './HRGlobalCalendar.css';

const HRGlobalCalendar = () => {
    const { companyId } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        if (!companyId) return;

        const fetchCalendarEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const [requestsRes, holidaysRes] = await Promise.all([
                    supabase
                        .from('requests')
                        .select('employee_name, start_date, end_date, status, request_type')
                        .eq('company_id', companyId)
                        .eq('status', 'Aprobada')
                        .in('request_type', ['Vacaciones', 'Asuntos Propios']),
                    supabase
                        .from('holidays')
                        .select('name, date')
                        .eq('company_id', companyId)
                ]);

                if (requestsRes.error) throw requestsRes.error;
                if (holidaysRes.error) throw holidaysRes.error;

                const vacationEvents = requestsRes.data.map(req => ({
                    type: 'vacation',
                    title: req.employee_name,
                    startDate: req.start_date,
                    endDate: req.end_date,
                }));

                const holidayEvents = holidaysRes.data.map(hol => ({
                    type: 'holiday',
                    title: hol.name,
                    startDate: hol.date,
                    endDate: hol.date,
                }));

                setEvents([...vacationEvents, ...holidayEvents]);
            } catch (err) {
                setError('No se pudieron cargar los eventos del calendario.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCalendarEvents();
    }, [companyId]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

    return (
        <div className="hr-panel-container">
            <div className="hr-panel-header">
                <h1>Calendario Global</h1>
            </div>

            <div className="calendar-legend">
                <span className="legend-item legend-vacation">Vacaciones / Ausencias</span>
                <span className="legend-item legend-holiday">Festivo</span>
            </div>

            <div className="calendar-header">
                <button onClick={handlePrevMonth}>&lt;</button>
                <h2>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</h2>
                <button onClick={handleNextMonth}>&gt;</button>
            </div>

            {loading && <p>Cargando eventos...</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="calendar-container">
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

export default HRGlobalCalendar;
