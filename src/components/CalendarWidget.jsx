import React from 'react';
import { formatDate } from '../utils/formatters';
import { getWeekdayNames, getDaysInMonth, getFirstDayOfMonth } from '../utils/calendar';

const CalendarWidget = ({
    currentDate,
    selectedDate,
    calendarViewMode,
    timeFilterMode,
    weekStart,
    locale,
    onNav,
    onSelectDate,
    onSelectMonth,
    onSelectYear,
    onSetViewMode,
    onGoToToday,
    getTaskCountForDate
}) => {
    
    return (
        <div className="rounded-xl p-4 mb-6 shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
            {/* Time Range Filter is handled by parent or passed as slot if needed, but here we assume it's external or top of this widget */}
            
            <div className="min-h-[320px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="ml-2 font-bold text-lg [text-shadow:1px_1px_1px_#fff,-1px_-1px_1px_#a3b1c6] dark:[text-shadow:1px_1px_1px_#373c43,-1px_-1px_1px_#21252a]">
                        {
                            calendarViewMode === 'days' ? formatDate(currentDate, locale, { month: 'long', year: 'numeric' }) :
                                calendarViewMode === 'months' ? formatDate(currentDate, locale, { year: 'numeric' }) :
                                    `${Math.floor(currentDate.getFullYear() / 12) * 12} - ${Math.floor(currentDate.getFullYear() / 12) * 12 + 11}`
                        }
                    </h3>

                    <div className="flex items-center text-center text-light-text-muted dark:text-dark-text-muted text-sm font-medium rounded-lg">
                        <button onClick={() => onNav(-1)} className="px-3 py-2 rounded-l-xl transition-all duration-150 hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark" title="Previous">&lt;</button>
                        <button onClick={onGoToToday} className="px-3 py-2 text-sm border-x border-light-text/10 dark:border-dark-text/10 transition-all duration-150 hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark" title="Go to Today">Today</button>
                        <button onClick={() => onNav(1)} className="px-3 py-2 rounded-r-xl transition-all duration-150 hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark" title="Next">&gt;</button>
                    </div>

                </div>

                <div className="grid grid-cols-7 gap-1 mb-2 h-8 items-center">
                    {calendarViewMode === 'days' && getWeekdayNames(weekStart, locale).map((day, index) => (
                        <div key={index} className="text-center text-light-text-muted dark:text-dark-text-muted text-sm font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                {calendarViewMode === 'days' && (
                    <div className="grid grid-cols-7 gap-1">
                        {[...Array(getFirstDayOfMonth(currentDate, weekStart)).keys()].map(i => (
                            <div key={`empty-${i}`} className="h-10"></div>
                        ))}
                        {[...Array(getDaysInMonth(currentDate)).keys()].map(i => {
                            const day = i + 1;
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isSelected = timeFilterMode === 'day' && date.toDateString() === selectedDate.toDateString();
                            const taskCount = getTaskCountForDate(date);
                            return (
                                <button
                                    key={day}
                                    onClick={() => onSelectDate(day)}
                                    className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-150 relative ${isSelected
                                        ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary'
                                        : isToday ? 'font-bold text-light-primary dark:text-dark-primary' : 'hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark'
                                        } `}
                                >
                                    <span>{day}</span>
                                    {taskCount > 0 && (
                                        <span className={`absolute right-1.5 bottom-1 text-xs ${isSelected ? 'opacity-75' : 'text-light-text-muted dark:text-dark-text-muted'}`}>
                                            {taskCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
                {calendarViewMode === 'months' && (() => {
                    const currentYear = currentDate.getFullYear();
                    const selectedYear = selectedDate.getFullYear();
                    const selectedMonth = selectedDate.getMonth();

                    if (timeFilterMode === 'quarter') {
                        const quarters = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]];
                        const selectedQuarter = Math.floor(selectedMonth / 3);

                        return (
                            <div className="space-y-2">
                                {quarters.map((quarterMonths, quarterIndex) => {
                                    const isCurrentQuarterSelected = selectedYear === currentYear && quarterIndex === selectedQuarter;

                                    return (
                                        <div
                                            key={quarterIndex}
                                            className={`flex rounded-lg transition-all duration-150 ${isCurrentQuarterSelected ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark' : 'gap-2'}`}
                                        >
                                            {quarterMonths.map((monthIndex, indexInQuarter) => {
                                                const monthDate = new Date(currentYear, monthIndex, 1);
                                                const borderRadiusClasses = [
                                                    'rounded-l-lg',
                                                    'rounded-none',
                                                    'rounded-r-lg'
                                                ];

                                                return (
                                                    <button
                                                        key={monthIndex}
                                                        onClick={() => onSelectMonth(monthIndex)}
                                                        className={`py-4 w-1/3 text-center transition-all duration-150 ${isCurrentQuarterSelected
                                                            ? `${borderRadiusClasses[indexInQuarter]} text-light-primary dark:text-dark-primary`
                                                            : 'rounded-lg hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark'
                                                            }`}
                                                    >
                                                        {formatDate(monthDate, locale, { month: 'short' })}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }

                    // Default month view (not quarter)
                    return (
                        <div className="grid grid-cols-3 gap-2">
                            {[...Array(12).keys()].map(monthIndex => {
                                const monthDate = new Date(currentYear, monthIndex, 1);
                                const isSelected = timeFilterMode === 'month' && currentYear === selectedYear && monthIndex === selectedMonth;

                                return (
                                    <button
                                        key={monthIndex}
                                        onClick={() => onSelectMonth(monthIndex)}
                                        className={`py-4 rounded-lg text-center transition-all duration-150 ${isSelected
                                            ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary'
                                            : 'hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark'
                                            }`}
                                    >
                                        {formatDate(monthDate, locale, { month: 'short' })}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })()}
                {calendarViewMode === 'years' && (
                    <div className="grid grid-cols-3 gap-2">
                        {[...Array(12).keys()].map(i => {
                            const startYear = Math.floor(currentDate.getFullYear() / 12) * 12;
                            const year = startYear + i;
                            const isSelected = timeFilterMode === 'year' && year === selectedDate.getFullYear();
                            return (
                                <button
                                    key={year}
                                    onClick={() => onSelectYear(year)}
                                    className={`py-4 rounded-lg text-center transition-all duration-150 ${isSelected
                                        ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary'
                                        : 'hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark'
                                        }`}
                                >
                                    {year}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarWidget;
