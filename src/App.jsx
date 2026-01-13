import React, { useState, useEffect, useMemo } from 'react';
import { LoaderCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import MatrixView from './components/MatrixView';
import ArchiveView from './components/ArchiveView';
import SettingsModal from './components/SettingsModal';
import { useTasks } from './hooks/useTasks';
import { useSettings } from './hooks/useSettings';
import { formatDate } from './utils/formatters';
import { openDB } from './utils/db';

function App() {
  // Data Hooks
  const {
    tasks,
    archivedTasks,
    isLoading: isTasksLoading,
    addTask: addTaskToDB,
    updateTask,
    deleteTask,
    archiveTask,
    restoreTask,
    deleteArchivedTask,
    refreshTasks
  } = useTasks();

  const { settings, updateSetting } = useSettings();

  // Settings Shorthands (derived from settings object)
  const locale = settings.locale || 'ru-RU';
  const theme = settings.theme || 'system';
  const weekStart = settings.weekStart || 0;
  const hideGlobal = settings.hideGlobal || false;
  const hideLocal = settings.hideLocal || false;
  const nsfwTags = settings.nsfwTags || '';

  // UI State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const viewMode = settings.viewMode || 'list';
  const setViewMode = (mode) => updateSetting('viewMode', mode);

  const [calendarViewMode, setCalendarViewMode] = useState('days');
  const [timeFilterMode, setTimeFilterMode] = useState('day');
  const [showArchived, setShowArchived] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const isDarkNow = mediaQuery.matches;
        root.classList.remove(isDarkNow ? 'light' : 'dark');
        root.classList.add(isDarkNow ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Task Actions
  const handleAddTask = (taskData) => {
    const today = new Date();
    const dueDate = selectedDate ? selectedDate.toISOString().split('T')[0] : today.toISOString().split('T')[0];

    const newTask = {
      id: Date.now(),
      text: taskData.text,
      completed: false,
      pinned: taskData.pinned,
      urgency: taskData.urgency,
      importance: taskData.importance,
      recurrence: taskData.recurrence || 'none', // none, daily, weekly, monthly, yearly
      createdAt: today.toISOString(),
      dueDate: dueDate
    };
    addTaskToDB(newTask);
  };

  const handleToggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.completed) {
      // Mark current as completed
      const completedTask = { ...task, completed: true };
      await updateTask(completedTask);

      // Handle Recurrence
      if (task.recurrence && task.recurrence !== 'none') {
        const nextDate = new Date(task.dueDate || new Date());

        switch (task.recurrence) {
          case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
          case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
          case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
          case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
        }

        const newTask = {
          ...task,
          id: Date.now(), // New ID
          completed: false,
          dueDate: nextDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        addTaskToDB(newTask);
      }

      // Immediately move old one to archive
      archiveTask(completedTask);
    }
  };

  const handleSaveEdit = (id, newText) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask({ ...task, text: newText });
    }
  };

  const handleToggleImportance = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateTask({ ...task, importance: !task.importance });
  };

  const handleToggleUrgency = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateTask({ ...task, urgency: !task.urgency });
  };

  const handleUpdatePinMode = (id, mode) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateTask({ ...task, pinned: mode });
  };

  // Calendar Logic
  const handleCalendarNav = (direction) => {
    const newDate = new Date(currentDate);
    if (calendarViewMode === 'days') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (calendarViewMode === 'months') {
      newDate.setFullYear(newDate.getFullYear() + direction);
    } else if (calendarViewMode === 'years') {
      newDate.setFullYear(newDate.getFullYear() + (direction * 12));
    }
    setCurrentDate(newDate);
  };

  const handleSelectDate = (day) => {
    const today = new Date();
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, today.getHours(), today.getMinutes(), today.getSeconds());
    setSelectedDate(newDate);
    setTimeFilterMode('day');
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setCalendarViewMode('days');
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => tasks.filter(task => {
    // Search Filter
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (hideGlobal && task.pinned === 'global') return false;
    if (hideLocal && task.pinned === 'local') return false;

    const hasSelectedTag = selectedTag
      ? (task.text.match(/#(\w+)/g) || []).map(t => t.substring(1)).includes(selectedTag)
      : true;

    if (!hasSelectedTag) return false;

    if (task.pinned === 'global') return true;

    if (!task.dueDate) return timeFilterMode === 'all';

    const taskDueDate = new Date(task.dueDate);

    // Create new Date objects to avoid mutation and ensure clean comparison
    const targetDate = new Date(selectedDate);

    // Normalize dates for comparison (ignoring time)
    const normalize = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    if (timeFilterMode === 'day') {
      return normalize(taskDueDate) === normalize(targetDate);
    }

    const taskYear = taskDueDate.getFullYear();
    const taskMonth = taskDueDate.getMonth();
    const taskQuarter = Math.floor(taskMonth / 3);

    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);

    if (timeFilterMode === 'month') return taskYear === currentYear && taskMonth === currentMonth;
    if (timeFilterMode === 'quarter') return taskYear === currentYear && taskQuarter === currentQuarter;
    if (timeFilterMode === 'year') return taskYear === currentYear;
    if (timeFilterMode === 'all') return true;

    return false;
  }), [tasks, hideGlobal, hideLocal, selectedTag, selectedDate, timeFilterMode, searchQuery]);

  const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
    const aPinned = a.pinned !== 'none';
    const bPinned = b.pinned !== 'none';

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    if (a.pinned === 'global' && b.pinned === 'local') return -1;
    if (a.pinned === 'local' && b.pinned === 'global') return 1;

    return 0;
  }), [filteredTasks]);

  const activeTasks = sortedTasks.filter(t => !t.completed);

  // Tag Cloud
  const allTags = useMemo(() => {
    const tagCounts = {};
    tasks.forEach(task => {
      const tags = task.text.match(/#(\w+)/g) || [];
      tags.forEach(tag => {
        const tagName = tag.substring(1);
        if (tagName) {
          tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
        }
      });
    });
    return Object.entries(tagCounts).sort(([, countA], [, countB]) => countB - countA);
  }, [tasks]);

  const nsfwTagList = useMemo(() => nsfwTags.split(',').map(t => t.trim()).filter(Boolean), [nsfwTags]);

  const getTaskCountForDate = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    }).length;
  };

  const getTaskListHeaderText = () => {
    if (selectedTag) return `Tasks with #${selectedTag}`;
    const now = selectedDate;
    const monthName = formatDate(now, locale, { month: 'long' });
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    switch (timeFilterMode) {
      case 'day': return formatDate(selectedDate, locale);
      case 'month': return `Tasks for ${monthName} ${year}`;
      case 'quarter': return `Tasks for Q${quarter} ${year}`;
      case 'year': return `Tasks for ${year}`;
      case 'all': return 'All Tasks';
      default: return formatDate(selectedDate, locale);
    }
  };

  // Global/Local Counts for Sidebar
  const globalPinnedCount = tasks.filter(t => t.pinned === 'global').length;
  const localPinnedCount = tasks.filter(t => {
    if (t.pinned !== 'local' || !t.createdAt) return false;
    const taskCreateDate = new Date(t.createdAt);
    return taskCreateDate.toDateString() === selectedDate.toDateString();
  }).length;

  // Import/Export Logic
  const handleExport = async () => {
    const exportData = {
      tasks,
      archived: archivedTasks,
      settings
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task_manager_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (jsonBuffer) => {
    try {
      const dec = new TextDecoder("utf-8");
      const json = dec.decode(jsonBuffer);
      const data = JSON.parse(json);

      const db = await openDB();
      // Use a single transaction for all data if possible, or sequential
      const tx = db.transaction(['tasks', 'archived', 'settings'], 'readwrite');

      if (data.tasks) {
        const store = tx.objectStore('tasks');
        data.tasks.forEach(t => store.put(t));
      }
      if (data.archived) {
        const store = tx.objectStore('archived');
        data.archived.forEach(t => store.put(t));
      }
      if (data.settings) {
        // For settings we usually use a separate hook or store, but we can write to DB here too
        // However, State update for settings needs to happen separately or via reload
        // Since settings state is managed by useSettings and it loads on mount...
        // We can manually update the settings store
        const store = tx.objectStore('settings');
        Object.keys(data.settings).forEach(key => {
          store.put({ id: key, value: data.settings[key] });
          updateSetting(key, data.settings[key]); // Update state as well
        });
      }

      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
      });

      // specific setting updates already triggered state updates
      // but tasks need refresh
      refreshTasks();

      alert('Import successful!');
    } catch (e) {
      console.error(e);
      alert('Error importing data');
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('Are you absolutely sure you want to delete all data?')) {
      const req = indexedDB.deleteDatabase('TaskManager');
      req.onsuccess = () => window.location.reload();
    }
  };


  if (isTasksLoading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle size={48} className="animate-spin text-light-primary dark:text-dark-primary" />
          <p className="text-light-text-muted dark:text-dark-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar
            currentDate={currentDate}
            selectedDate={selectedDate}
            viewMode={viewMode}
            calendarViewMode={calendarViewMode}
            timeFilterMode={timeFilterMode}
            showArchived={showArchived}
            hideGlobal={hideGlobal}
            hideLocal={hideLocal}
            weekStart={weekStart}
            locale={locale}
            allTags={allTags}
            selectedTag={selectedTag}
            activeTasksCount={activeTasks.length}
            archivedTasksCount={archivedTasks.length}
            globalPinnedCount={globalPinnedCount}
            localPinnedCount={localPinnedCount}

            setViewMode={setViewMode}
            setShowArchived={setShowArchived}
            setShowSettings={setShowSettings}
            setTimeFilterMode={setTimeFilterMode}
            setCalendarViewMode={setCalendarViewMode}
            onCalendarNav={handleCalendarNav}
            onSelectDate={handleSelectDate}
            onSelectMonth={(m) => {
              const newDate = new Date(currentDate.getFullYear(), m, 1);
              setCurrentDate(newDate);
              setSelectedDate(newDate);
            }}
            onSelectYear={(y) => {
              const newDate = new Date(y, currentDate.getMonth(), 1);
              setCurrentDate(newDate);
              setSelectedDate(newDate);
            }}
            onGoToToday={handleGoToToday}
            onToggleHideGlobal={() => updateSetting('hideGlobal', !hideGlobal)}
            onToggleHideLocal={() => updateSetting('hideLocal', !hideLocal)}
            setSelectedTag={setSelectedTag}
            onAddTask={handleAddTask}
            getTaskCountForDate={getTaskCountForDate}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <div className="lg:w-2/3">
            {!showArchived && (
              <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full px-4 py-3 rounded-lg bg-transparent shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {showArchived ? (
              <ArchiveView
                archivedTasks={archivedTasks}
                onRestore={restoreTask}
                onDelete={deleteArchivedTask}
                nsfwTagList={nsfwTagList}
                locale={locale}
                onTagClick={setSelectedTag}
              />
            ) : viewMode === 'list' ? (
              <TaskList
                tasks={activeTasks}
                headerText={getTaskListHeaderText()}
                selectedDate={selectedDate}
                locale={locale}
                nsfwTagList={nsfwTagList}
                onToggleComplete={handleToggleComplete}
                onSaveEdit={handleSaveEdit}
                onDelete={deleteTask}
                onToggleImportance={handleToggleImportance}
                onToggleUrgency={handleToggleUrgency}
                onUpdatePinMode={handleUpdatePinMode}
                onTagClick={setSelectedTag}
                onUpdateTask={updateTask}
              />
            ) : (
              <MatrixView
                tasks={activeTasks}
                headerText={getTaskListHeaderText()}
                locale={locale}
                nsfwTagList={nsfwTagList}
                onToggleComplete={handleToggleComplete}
                onSaveEdit={handleSaveEdit}
                onDelete={deleteTask}
                onToggleImportance={handleToggleImportance}
                onToggleUrgency={handleToggleUrgency}
                onUpdatePinMode={handleUpdatePinMode}
                onUpdateTask={updateTask}
                onTagClick={(tag) => {
                  setSelectedTag(tag);
                  setViewMode('list');
                }}
              />
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        locale={locale}
        setLocale={(v) => updateSetting('locale', v)}
        nsfwTags={nsfwTags}
        setNsfwTags={(v) => updateSetting('nsfwTags', v)}
        theme={theme}
        setTheme={(v) => updateSetting('theme', v)}
        weekStart={weekStart}
        setWeekStart={(v) => updateSetting('weekStart', v)}
        onClearDatabase={handleClearDatabase}
        onExport={handleExport}
        onImport={handleImport}
        onSave={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;
