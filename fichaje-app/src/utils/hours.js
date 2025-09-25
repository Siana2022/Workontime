/**
 * Parses a time string (e.g., "09:00-17:00, 18:00-20:00") and calculates the total hours.
 * @param {string} timeRanges - The string containing time ranges.
 * @returns {number} The total number of hours.
 */
export const parseTimeRangesToHours = (timeRanges) => {
    if (!timeRanges || typeof timeRanges !== 'string') {
        return 0;
    }

    let totalHours = 0;
    const ranges = timeRanges.split(',').map(r => r.trim());

    for (const range of ranges) {
        const [start, end] = range.split('-');
        if (!start || !end) continue;

        const [startHours, startMinutes] = start.split(':').map(Number);
        const [endHours, endMinutes] = end.split(':').map(Number);

        if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
            continue;
        }

        const startTime = startHours + startMinutes / 60;
        const endTime = endHours + endMinutes / 60;

        if (endTime > startTime) {
            totalHours += (endTime - startTime);
        }
    }

    return totalHours;
};

/**
 * Calculates the theoretical hours an employee should work on a given date based on their schedule.
 * @param {object} schedule - The employee's schedule object.
 * @param {Date} date - The date to calculate hours for.
 * @returns {number} The theoretical hours for the day.
 */
export const getTheoreticalHoursForDay = (schedule, date) => {
    if (!schedule) {
        return 0;
    }

    if (schedule.schedule_type === 'Específico' && schedule.details) {
        const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' });
        const dayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
        const timeRanges = schedule.details[dayName];
        return parseTimeRangesToHours(timeRanges);
    }

    if (schedule.schedule_type === 'Abierto') {
        const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            return (schedule.hours_per_week || 0) / 5;
        }
    }

    return 0;
};

/**
 * Calculates the actual worked hours for an employee on a given date from their time entries,
 * correctly handling multiple check-ins and pauses.
 * @param {Array} timeEntries - An array of time entry objects for a specific day, sorted chronologically.
 * @returns {number} The total worked hours.
 */
export const calculateActualWorkedHours = (timeEntries) => {
    if (!timeEntries || timeEntries.length === 0) {
        return 0;
    }

    let totalMillis = 0;
    let sessionStartMillis = 0;
    let isWorking = false;

    for (const entry of timeEntries) {
        const eventTimeMillis = new Date(entry.created_at).getTime();

        if (entry.action === 'Entrada' || entry.action === 'Reanudar') {
            if (!isWorking) {
                sessionStartMillis = eventTimeMillis;
                isWorking = true;
            }
        } else if (entry.action === 'Pausa' || entry.action === 'Salida') {
            if (isWorking) {
                totalMillis += (eventTimeMillis - sessionStartMillis);
                isWorking = false;
                sessionStartMillis = 0;
            }
        }
    }

    return totalMillis / (1000 * 60 * 60);
};