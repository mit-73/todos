import React from 'react';
import { Settings, Grid, List, Archive, Shield, Pin, X } from 'lucide-react';
import CalendarWidget from './CalendarWidget';
import TaskInput from './TaskInput';

const Sidebar = ({
    currentDate,
    selectedDate,
    viewMode,
    calendarViewMode,
    timeFilterMode,
    showArchived,
    hideGlobal,
    hideLocal,
    weekStart,
    locale,
    allTags,
    selectedTag,
    tagSuggestions,
    showTagSuggestions,
    highlightedTagIndex, // This is managed by TaskInput mostly, avoiding lifting if possible
    activeTasksCount,
    archivedTasksCount,
    globalPinnedCount,
    localPinnedCount,

    // Actions
    setViewMode,
    setShowArchived,
    setShowSettings,
    setTimeFilterMode,
    setCalendarViewMode,
    onCalendarNav,
    onSelectDate,
    onSelectMonth,
    onSelectYear,
    onGoToToday,
    onToggleHideGlobal,
    onToggleHideLocal,
    setSelectedTag,
    onAddTask,
    getTaskCountForDate,
    searchQuery,
    setSearchQuery
}) => {
    return (
        <div className="lg:w-1/3">
            <div className="sticky top-8 bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6 flex flex-col">
                <div className="flex flex-row gap-4 mb-4">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
                            disabled={showArchived}
                            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={viewMode === 'list' ? 'Switch to Matrix View' : 'Switch to List View'}
                        >
                            {viewMode === 'list' ? <Grid size={20} /> : <List size={20} />}
                            <span className="hidden sm:inline font-semibold">{viewMode === 'list' ? 'Matrix' : 'List'}</span>
                        </button>
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-all duration-150 ${showArchived ?
                                'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' :
                                'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                        >
                            <Archive size={20} />
                            <span className="hidden sm:inline font-semibold">Archive</span>
                        </button>
                    </div>
                    <button
                            onClick={() => setShowSettings(true)}
                            className="p-4 rounded-lg transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                        >
                            <Settings size={20} />
                        </button>
                </div>

                {/* Time Range Filter (moved from widget to sidebar for better layout control potentially, but keeping logic close) */}
                {!showArchived && (
                    <div className="mb-4">
                        <div className="grid grid-cols-5 gap-3 p-2 rounded-xl shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
                            {[
                                { id: 'day', label: 'Day' },
                                { id: 'month', label: 'Month' },
                                { id: 'quarter', label: 'Quarter' },
                                { id: 'year', label: 'Year' },
                                { id: 'all', label: 'All' },
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => {
                                        setTimeFilterMode(filter.id);
                                        if (filter.id === 'day' || filter.id === 'all') { setCalendarViewMode('days'); }
                                        else if (filter.id === 'month' || filter.id === 'quarter') { setCalendarViewMode('months'); }
                                        else if (filter.id === 'year') { setCalendarViewMode('years'); }
                                    }}
                                    className={`px-1 py-1.5 text-xs sm:text-sm rounded-lg transition-all duration-200 flex-1 text-center font-semibold ${timeFilterMode === filter.id
                                        ? 'text-light-primary dark:text-dark-primary shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'
                                        : 'text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'
                                        }`}
                                >{filter.label}</button>
                            ))}
                        </div>
                    </div>
                )}

                <CalendarWidget
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    calendarViewMode={calendarViewMode}
                    timeFilterMode={timeFilterMode}
                    weekStart={weekStart}
                    locale={locale}
                    onNav={onCalendarNav}
                    onSelectDate={onSelectDate}
                    onSelectMonth={onSelectMonth}
                    onSelectYear={onSelectYear}
                    onSetViewMode={setCalendarViewMode}
                    onGoToToday={onGoToToday}
                    getTaskCountForDate={getTaskCountForDate}
                />

                {!showArchived && (
                    <div className="flex p-2 justify-between">
                        <div className="flex gap-4">
                            {/* Hide Global Tasks Switch */}
                            <div className="flex items-center gap-2 text-light-text-muted dark:text-dark-text-muted">
                                <Shield size={20} />
                                <button
                                    onClick={onToggleHideGlobal}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${hideGlobal ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full transition-all ${hideGlobal ? 'translate-x-1 bg-light-text-muted dark:bg-dark-text-muted' : 'translate-x-6 bg-light-primary'}`}
                                    />
                                </button>
                            </div>

                            {/* Hide Local Tasks Switch */}
                            <div className="flex items-center gap-2 text-light-text-muted dark:text-dark-text-muted">
                                <Pin size={20} />
                                <button
                                    onClick={onToggleHideLocal}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${hideLocal ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full transition-all ${hideLocal ? 'translate-x-1 bg-light-text-muted dark:bg-dark-text-muted' : 'translate-x-6 bg-light-primary'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tag Cloud */}
                {allTags.length > 0 && !showArchived && (
                    <div className="mt-6 pt-4 border-t border-light-text/10 dark:border-dark-text/10">
                        <h4 className="font-semibold mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {allTags.map(([tag, count]) => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={`px-2 py-1 text-xs rounded-lg transition-all duration-150 ${selectedTag === tag
                                        ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary'
                                        : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                                >
                                    #{tag} <span className={`${selectedTag === tag ? 'opacity-70' : 'text-light-text-muted dark:text-dark-text-muted'}`}>{count}</span>
                                </button>
                            ))}
                            {selectedTag && (
                                <button onClick={() => setSelectedTag(null)} className="p-1 rounded-full shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!showArchived && (
                    <TaskInput
                        onAddTask={onAddTask}
                        allTags={allTags}
                    />
                )}
            </div>

            {/* Task Counters */}
            <div className="mt-4 text-center text-light-text-muted dark:text-dark-text-muted text-sm">
                {!showArchived ? (
                    <>
                        {activeTasksCount} active tasks
                        {(globalPinnedCount > 0 || localPinnedCount > 0) && (
                            <span className="ml-2">
                                • {globalPinnedCount > 0 && `${globalPinnedCount} global pinned`}
                                {globalPinnedCount > 0 && localPinnedCount > 0 && ', '}
                                {localPinnedCount > 0 && `${localPinnedCount} local pinned`}
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        {archivedTasksCount} archived tasks
                    </>
                )}
            </div>

        </div>
    );
};

export default Sidebar;
