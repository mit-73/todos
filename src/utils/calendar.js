export const getWeekdayNames = (weekStart, locale) => {
    const weekdays = [];
    const date = new Date();
    // Start from the configured week start day (current day - current day of week + weekStart)
    // Note: getDay() returns 0 for Sunday.
    const currentDay = date.getDay();
    const distanceToStart = currentDay - weekStart;
    date.setDate(date.getDate() - distanceToStart);
 
    for (let i = 0; i < 7; i++) {
       weekdays.push(new Date(date).toLocaleDateString(locale, { weekday: 'short' }));
       date.setDate(date.getDate() + 1);
    }
 
    return weekdays;
 };
 
 export const getDaysInMonth = (date) => {
     return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
 };
 
 export const getFirstDayOfMonth = (date, weekStart) => {
     const today = new Date();
     const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
     return (firstDay - weekStart + 7) % 7;
 };
