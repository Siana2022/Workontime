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