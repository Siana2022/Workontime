export const getDaysInMonth = (year, month) => {
    // The '0' day of the next month gives us the last day of the current month
    return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
    // Returns the day of the week (0=Sun, 1=Mon, ..., 6=Sat)
    const day = new Date(year, month, 1).getDay();
    // Adjust so that Monday is 0 and Sunday is 6
    return (day === 0) ? 6 : day - 1;
};

export const generateMonthGrid = (year, month) => {
    const daysInCurrentMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = getFirstDayOfMonth(year, month);

    // Get the number of days in the previous month for padding
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

    const grid = [];
    let dayCounter = 1;
    let nextMonthDayCounter = 1;

    for (let i = 0; i < 6; i++) { // Max 6 weeks in a month view
        const week = [];
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDayOfWeek) {
                // Days from the previous month
                week.push({
                    day: daysInPrevMonth - firstDayOfWeek + j + 1,
                    month: 'previous',
                });
            } else if (dayCounter > daysInCurrentMonth) {
                // Days from the next month
                week.push({
                    day: nextMonthDayCounter++,
                    month: 'next',
                });
            } else {
                // Days from the current month
                week.push({
                    day: dayCounter++,
                    month: 'current',
                    date: new Date(year, month, dayCounter - 1)
                });
            }
        }
        grid.push(week);
        if (dayCounter > daysInCurrentMonth) break; // Stop if we've passed the end of the month
    }

    return grid;
};