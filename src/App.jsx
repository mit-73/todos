import React, { useState, useEffect, useRef } from 'react';
// import './App.css'
import { Plus, Trash2, Check, Pin, Archive, List, Send, Calendar, Globe, MapPin, Settings, X, Edit, Link, Eye, EyeOff } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [db, setDb] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const [showSettings, setShowSettings] = useState(false);
  const [locale, setLocale] = useState('en-US');
  const [theme, setTheme] = useState('purple');
  const [weekStart, setWeekStart] = useState(0); // 0 = Sunday, 1 = Monday
  const [hideGlobal, setHideGlobal] = useState(false);
  const [hideLocal, setHideLocal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const textareaRef = useRef(null);
  const editInputRef = useRef(null);

  // Theme colors mapping
  const themes = {
    purple: {
      primary: 'purple',
      gradientFrom: 'from-purple-50',
      gradientTo: 'to-purple-100',
      bgPrimary: 'bg-purple-50',
      bgSecondary: 'bg-purple-100',
      textPrimary: 'text-purple-800',
      textSecondary: 'text-purple-600',
      textMuted: 'text-purple-500',
      textLight: 'text-purple-400',
      border: 'border-purple-200',
      focus: 'focus:border-purple-500',
      buttonPrimary: 'bg-purple-600',
      buttonPrimaryHover: 'hover:bg-purple-700',
      buttonSecondary: 'bg-purple-100',
      buttonSecondaryHover: 'hover:bg-purple-200',
      ring: 'ring-purple-300',
      calendarToday: 'bg-purple-300 border-purple-400',
      calendarSelected: 'bg-purple-600 text-white',
      calendarHover: 'hover:bg-purple-200'
    },
    blue: {
      primary: 'blue',
      gradientFrom: 'from-blue-50',
      gradientTo: 'to-blue-100',
      bgPrimary: 'bg-blue-50',
      bgSecondary: 'bg-blue-100',
      textPrimary: 'text-blue-800',
      textSecondary: 'text-blue-600',
      textMuted: 'text-blue-500',
      textLight: 'text-blue-400',
      border: 'border-blue-200',
      focus: 'focus:border-blue-500',
      buttonPrimary: 'bg-blue-600',
      buttonPrimaryHover: 'hover:bg-blue-700',
      buttonSecondary: 'bg-blue-100',
      buttonSecondaryHover: 'hover:bg-blue-200',
      ring: 'ring-blue-300',
      calendarToday: 'bg-blue-300 border-blue-400',
      calendarSelected: 'bg-blue-600 text-white',
      calendarHover: 'hover:bg-blue-200'
    },
    green: {
      primary: 'green',
      gradientFrom: 'from-green-50',
      gradientTo: 'to-green-100',
      bgPrimary: 'bg-green-50',
      bgSecondary: 'bg-green-100',
      textPrimary: 'text-green-800',
      textSecondary: 'text-green-600',
      textMuted: 'text-green-500',
      textLight: 'text-green-400',
      border: 'border-green-200',
      focus: 'focus:border-green-500',
      buttonPrimary: 'bg-green-600',
      buttonPrimaryHover: 'hover:bg-green-700',
      buttonSecondary: 'bg-green-100',
      buttonSecondaryHover: 'hover:bg-green-200',
      ring: 'ring-green-300',
      calendarToday: 'bg-green-300 border-green-400',
      calendarSelected: 'bg-green-600 text-white',
      calendarHover: 'hover:bg-green-200'
    },
    pink: {
      primary: 'pink',
      gradientFrom: 'from-pink-50',
      gradientTo: 'to-pink-100',
      bgPrimary: 'bg-pink-50',
      bgSecondary: 'bg-pink-100',
      textPrimary: 'text-pink-800',
      textSecondary: 'text-pink-600',
      textMuted: 'text-pink-500',
      textLight: 'text-pink-400',
      border: 'border-pink-200',
      focus: 'focus:border-pink-500',
      buttonPrimary: 'bg-pink-600',
      buttonPrimaryHover: 'hover:bg-pink-700',
      buttonSecondary: 'bg-pink-100',
      buttonSecondaryHover: 'hover:bg-pink-200',
      ring: 'ring-pink-300',
      calendarToday: 'bg-pink-300 border-pink-400',
      calendarSelected: 'bg-pink-600 text-white',
      calendarHover: 'hover:bg-pink-200'
    }
  };

  const currentTheme = themes[theme];

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = () => {
      const request = indexedDB.open('TaskManager', 5); // Increment version

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
      };

      request.onsuccess = (event) => {
        const database = event.target.result;
        setDb(database);
        loadTasks(database);
        loadSettings(database);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // Create tasks store if it doesn't exist
        if (!database.objectStoreNames.contains('tasks')) {
          const taskStore = database.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('completed', 'completed', { unique: false });
          taskStore.createIndex('pinned', 'pinned', { unique: false });
          taskStore.createIndex('createdAt', 'createdAt', { unique: false });
          taskStore.createIndex('dueDate', 'dueDate', { unique: false });
        }

        // Create archived store if it doesn't exist
        if (!database.objectStoreNames.contains('archived')) {
          const archivedStore = database.createObjectStore('archived', { keyPath: 'id' });
          archivedStore.createIndex('archivedAt', 'archivedAt', { unique: false });
        }

        // Create settings store if it doesn't exist
        if (!database.objectStoreNames.contains('settings')) {
          const settingsStore = database.createObjectStore('settings', { keyPath: 'id' });
          settingsStore.put({ id: 'locale', value: 'en-US' });
          settingsStore.put({ id: 'theme', value: 'purple' });
          settingsStore.put({ id: 'weekStart', value: 0 }); // Sunday by default
          settingsStore.put({ id: 'hideGlobal', value: false });
          settingsStore.put({ id: 'hideLocal', value: false });
        }
      };
    };

    initDB();
  }, []);

  // Load settings from IndexedDB
  const loadSettings = (database) => {
    if (!database) return;

    try {
      const transaction = database.transaction(['settings'], 'readonly');
      const settingsStore = transaction.objectStore('settings');

      const localeRequest = settingsStore.get('locale');
      const themeRequest = settingsStore.get('theme');
      const weekStartRequest = settingsStore.get('weekStart');
      const hideGlobalRequest = settingsStore.get('hideGlobal');
      const hideLocalRequest = settingsStore.get('hideLocal');

      localeRequest.onsuccess = () => {
        if (localeRequest.result) {
          setLocale(localeRequest.result.value);
        }
      };

      themeRequest.onsuccess = () => {
        if (themeRequest.result) {
          setTheme(themeRequest.result.value);
        }
      };

      weekStartRequest.onsuccess = () => {
        if (weekStartRequest.result) {
          setWeekStart(weekStartRequest.result.value);
        }
      };

      hideGlobalRequest.onsuccess = () => {
        if (hideGlobalRequest.result) {
          setHideGlobal(hideGlobalRequest.result.value);
        }
      };

      hideLocalRequest.onsuccess = () => {
        if (hideLocalRequest.result) {
          setHideLocal(hideLocalRequest.result.value);
        }
      };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to IndexedDB
  const saveSetting = (key, value) => {
    if (!db) return;

    try {
      const transaction = db.transaction(['settings'], 'readwrite');
      const settingsStore = transaction.objectStore('settings');
      settingsStore.put({ id: key, value: value });
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingTask && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTask]);

  // Load tasks from IndexedDB
  const loadTasks = (database) => {
    if (!database) return;

    try {
      const transaction = database.transaction(['tasks', 'archived'], 'readonly');
      const taskStore = transaction.objectStore('tasks');
      const archivedStore = transaction.objectStore('archived');

      const taskRequest = taskStore.getAll();
      const archivedRequest = archivedStore.getAll();

      taskRequest.onsuccess = () => {
        setTasks(taskRequest.result || []);
      };

      archivedRequest.onsuccess = () => {
        setArchivedTasks(archivedRequest.result || []);
      };
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Save task to IndexedDB
  const saveTaskToDB = (task, storeName = 'tasks') => {
    if (!db) return;

    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(task);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Delete task from IndexedDB
  const deleteTaskFromDB = (id, storeName = 'tasks') => {
    if (!db) return;

    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Move task to archive
  const moveToArchive = (task) => {
    if (!db) return;

    try {
      // Remove from tasks store
      deleteTaskFromDB(task.id, 'tasks');

      // Add to archived store
      const archivedTask = { ...task, archivedAt: new Date().toISOString() };
      saveTaskToDB(archivedTask, 'archived');

      // Update state
      setTasks(tasks.filter(t => t.id !== task.id));
      setArchivedTasks([...archivedTasks, archivedTask]);
    } catch (error) {
      console.error('Error moving task to archive:', error);
    }
  };

  // Restore task from archive
  const restoreTask = (task) => {
    if (!db) return;

    try {
      // Remove from archived store
      deleteTaskFromDB(task.id, 'archived');

      // Add to tasks store
      const restoredTask = { ...task, completed: false };
      delete restoredTask.archivedAt;
      saveTaskToDB(restoredTask, 'tasks');

      // Update state
      setArchivedTasks(archivedTasks.filter(t => t.id !== task.id));
      setTasks([...tasks, restoredTask]);
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  const addTask = () => {
    if (inputValue.trim() !== '') {
      const today = new Date();
      const dueDate = selectedDate ? selectedDate.toISOString().split('T')[0] : today.toISOString().split('T')[0];

      const newTask = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
        pinned: 'none', // 'none', 'global', 'local'
        createdAt: today.toISOString(),
        dueDate: dueDate
      };

      saveTaskToDB(newTask);
      setTasks([...tasks, newTask]);
      setInputValue('');
    }
  };

  const deleteTask = (id) => {
    deleteTaskFromDB(id);
    setTasks(tasks.filter(task => task.id !== id));
  };

  const deleteArchivedTask = (id) => {
    deleteTaskFromDB(id, 'archived');
    setArchivedTasks(archivedTasks.filter(task => task.id !== id));
  };

  const toggleComplete = (id) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, completed: !task.completed };
        if (updatedTask.completed) {
          moveToArchive(updatedTask);
          return null; // Remove from current tasks list
        } else {
          saveTaskToDB(updatedTask);
          return updatedTask;
        }
      }
      return task;
    }).filter(Boolean); // Remove null values

    setTasks(updatedTasks);
  };

  const setPinMode = (id, mode) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, pinned: mode };
        saveTaskToDB(updatedTask);
        return updatedTask;
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const today = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1, today.getHours(), today.getMinutes(), today.getSeconds()).getDay();
    // Adjust for week start setting
    return (firstDay - weekStart + 7) % 7;
  };

  const prevMonth = () => {
    const today = new Date();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1, today.getHours(), today.getMinutes(), today.getSeconds()));
  };

  const nextMonth = () => {
    const today = new Date();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1, today.getHours(), today.getMinutes(), today.getSeconds()));
  };

  const selectDate = (day) => {
    const today = new Date();
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, today.getHours(), today.getMinutes(), today.getSeconds());
    setSelectedDate(newDate);
  };

  // Filter tasks by selected date
  const filteredTasks = tasks.filter(task => {
    // Hide global tasks if setting is enabled
    if (hideGlobal && task.pinned === 'global') return false;

    // Hide local tasks if setting is enabled
    if (hideLocal && task.pinned === 'local') return false;

    // Always show global pinned tasks (unless hidden)
    if (task.pinned === 'global' && !hideGlobal) return true;

    // Show tasks with due date matching selected date
    if (!task.dueDate) return false;
    const taskDueDate = new Date(task.dueDate);
    return taskDueDate.toDateString() === selectedDate.toDateString();
  });

  // Sort tasks: pinned first, then others
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aPinned = a.pinned !== 'none';
    const bPinned = b.pinned !== 'none';

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // Global pinned tasks come before local pinned tasks
    if (a.pinned === 'global' && b.pinned === 'local') return -1;
    if (a.pinned === 'local' && b.pinned === 'global') return 1;

    return 0;
  });

  const activeTasks = sortedTasks.filter(t => !t.completed);
  const completedTasks = sortedTasks.filter(t => t.completed);

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    }).length;
  };

  // Get pinned task counts for display
  const globalPinnedCount = tasks.filter(t => t.pinned === 'global').length;
  const localPinnedCount = tasks.filter(t => {
    if (t.pinned !== 'local' || !t.createdAt) return false;
    const taskCreateDate = new Date(t.createdAt);
    return taskCreateDate.toDateString() === selectedDate.toDateString();
  }).length;

  // Format date according to locale
  const formatDate = (date, options = {}) => {
    return new Date(date).toLocaleDateString(locale, options);
  };

  // Weekday names for calendar
  const getWeekdayNames = () => {
    const weekdays = [];
    const date = new Date();

    // Start from the configured week start day
    date.setDate(date.getDate() - date.getDay() + weekStart);

    for (let i = 0; i < 7; i++) {
      weekdays.push(new Date(date).toLocaleDateString(locale, { weekday: 'short' }));
      date.setDate(date.getDate() + 1);
    }

    return weekdays;
  };

  // Save settings
  const saveSettings = () => {
    saveSetting('locale', locale);
    saveSetting('theme', theme);
    saveSetting('weekStart', weekStart);
    saveSetting('hideGlobal', hideGlobal);
    saveSetting('hideLocal', hideLocal);
    setShowSettings(false);
  };

  // Close settings on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowSettings(false);
        setEditingTask(null);
      }
    };

    if (showSettings || editingTask) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSettings, editingTask]);

  // Handle double click to edit task
  const handleDoubleClick = (task) => {
    setEditingTask(task.id);
    setEditText(task.text);
  };

  // Save edited task
  const saveEditedTask = () => {
    if (editingTask && editText.trim() !== '') {
      const updatedTasks = tasks.map(task => {
        if (task.id === editingTask) {
          const updatedTask = { ...task, text: editText.trim() };
          saveTaskToDB(updatedTask);
          return updatedTask;
        }
        return task;
      });

      setTasks(updatedTasks);
      setEditingTask(null);
      setEditText('');
    }
  };

  // Handle edit input key press
  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEditedTask();
    } else if (e.key === 'Escape') {
      setEditingTask(null);
      setEditText('');
    }
  };

  // Convert URLs in text to clickable links
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Toggle hide global tasks
  const toggleHideGlobal = () => {
    const newHideGlobal = !hideGlobal;
    setHideGlobal(newHideGlobal);
    saveSetting('hideGlobal', newHideGlobal);
  };

  // Toggle hide local tasks
  const toggleHideLocal = () => {
    const newHideLocal = !hideLocal;
    setHideLocal(newHideLocal);
    saveSetting('hideLocal', newHideLocal);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.gradientFrom} ${currentTheme.gradientTo}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sticky Calendar Section */}
          <div className="lg:w-1/3">
            <div className={`sticky top-4 ${currentTheme.bgPrimary} rounded-2xl shadow-lg p-6`}>
              <div className="flex flex-row gap-4 mb-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`flex grow items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${showArchived
                    ? `${currentTheme.buttonPrimary} text-white ${currentTheme.buttonPrimaryHover}`
                    : `${currentTheme.buttonSecondary} ${currentTheme.textSecondary} ${currentTheme.buttonSecondaryHover}`
                    }`}
                >
                  {showArchived ? <List size={20} /> : <Archive size={20} />}
                  {showArchived ? 'Active Tasks' : 'Archived Tasks'}
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(true)}
                  className={`p-4 rounded-lg ${currentTheme.buttonSecondary} ${currentTheme.buttonSecondaryHover} ${currentTheme.textSecondary}`}
                >
                  <Settings size={20} />
                </button>
              </div>

              {/* Calendar */}
              <div className={`${currentTheme.bgSecondary} rounded-xl p-4 mb-6`}>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={prevMonth}
                    className={`p-2 rounded-lg ${currentTheme.buttonSecondary} ${currentTheme.buttonSecondaryHover} ${currentTheme.textSecondary}`}
                  >
                    &lt;
                  </button>
                  <h3 className={`font-semibold ${currentTheme.textPrimary}`}>
                    {formatDate(currentDate, { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className={`p-2 rounded-lg ${currentTheme.buttonSecondary} ${currentTheme.buttonSecondaryHover} ${currentTheme.textSecondary}`}
                  >
                    &gt;
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {getWeekdayNames().map((day, index) => (
                    <div key={index} className={`text-center ${currentTheme.textSecondary} text-sm font-medium py-1`}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {[...Array(getFirstDayOfMonth(currentDate)).keys()].map(i => (
                    <div key={`empty-${i}`} className="h-10"></div>
                  ))}

                  {[...Array(getDaysInMonth(currentDate)).keys()].map(i => {
                    const day = i + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const taskCount = getTasksForDate(date);

                    return (
                      <button
                        key={day}
                        onClick={() => selectDate(day)}
                        className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative
                          ${isToday ? currentTheme.calendarToday : (isSelected ? currentTheme.calendarSelected : currentTheme.calendarHover)}
                          ${taskCount > 0 ? 'font-bold' : ''}`}
                      >
                        <span>{day}</span>
                        {taskCount > 0 && (
                          <span className={`text-xs ${isSelected ? 'text-white/80' : currentTheme.textSecondary}`}>
                            {taskCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex grid-cols-4">
                {/* Hide Global Tasks Switch */}
                <div className="flex items-center gap-1">
                  <Globe size={20} className={currentTheme.textSecondary} />
                  <button
                    onClick={toggleHideGlobal}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideGlobal ? 'bg-gray-300' : currentTheme.buttonPrimary
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideGlobal ? 'translate-x-1' : 'translate-x-6'
                        }`}
                    />
                  </button>
                </div>

                {/* Hide Local Tasks Switch */}
                <div className="flex items-center gap-1 ml-5">
                  <MapPin size={20} className={currentTheme.textSecondary} />
                  <button
                    onClick={toggleHideLocal}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideLocal ? 'bg-gray-300' : currentTheme.buttonPrimary
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideLocal ? 'translate-x-1' : 'translate-x-6'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Task Input */}
              <div className="mt-6">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    // disabled={selectedDate.getTime() < new Date().getTime()} TODO!
                    placeholder="Add a new task..."
                    className={`w-full px-4 py-3 pr-12 rounded-xl border-2 ${currentTheme.border} ${currentTheme.focus} focus:outline-none transition-colors resize-none min-h-[60px] max-h-64 ${currentTheme.bgPrimary} ${currentTheme.textPrimary}`}
                    rows="2"
                  />
                  <button
                    onClick={addTask}
                    disabled={!inputValue.trim()}
                    className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors duration-200 ${inputValue.trim()
                      ? `${currentTheme.buttonPrimary} ${currentTheme.buttonPrimaryHover} text-white`
                      : `${currentTheme.bgSecondary.replace('bg-', 'bg-')} ${currentTheme.textLight} cursor-not-allowed`
                      }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
                <div className={`text-xs ${currentTheme.textLight} mt-2 text-center`}>
                  Press Enter to submit, Shift+Enter for new line
                </div>
              </div>
            </div>
            {/* Task Counters */}
            <div className={`mt-4 text-center ${currentTheme.textSecondary} text-sm`}>
              {!showArchived ? (
                <>
                  {activeTasks.length} active tasks
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
                  {archivedTasks.length} archived tasks
                </>
              )}
            </div>
          </div>

          {/* Task List Section */}
          <div className="lg:w-2/3">
            <div className={`${currentTheme.bgPrimary} rounded-2xl shadow-lg p-6`}>
              <div className="mb-4">
                <p className={currentTheme.textSecondary}>
                  {showArchived
                    ? `${archivedTasks.length} tasks`
                    : `${formatDate(selectedDate)} - ${activeTasks.length} tasks`}
                </p>
              </div>

              {!showArchived ? (
                <>
                  {sortedTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`${currentTheme.textLight} mb-4`}>
                        <Check size={48} className="mx-auto" />
                      </div>
                      <p className={currentTheme.textMuted}>
                        No tasks for {formatDate(selectedDate)}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {sortedTasks.map((task) => {
                        return (
                          <li
                            key={task.id}
                            className={`flex items-start justify-between p-4 rounded-xl transition-all duration-200 ${task.completed
                              ? `${currentTheme.bgSecondary} border ${currentTheme.border}`
                              : `${currentTheme.bgSecondary} border ${currentTheme.border.replace('border-purple-200', 'border-purple-100')}`
                              } ${task.pinned !== 'none' ? `ring-2 ${currentTheme.ring}` : ''}`}
                          >
                            <div className="flex items-start space-x-3 flex-1">
                              <button
                                onClick={() => toggleComplete(task.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-1 flex-shrink-0 ${task.completed
                                  ? `${currentTheme.buttonPrimary} border-purple-600 text-white`
                                  : `border-purple-400 hover:border-purple-600`
                                  }`}
                              >
                                {task.completed && <Check size={16} />}
                              </button>
                              <div className="flex-1">
                                {editingTask === task.id ? (
                                  <div className="w-full">
                                    <textarea
                                      ref={editInputRef}
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      onKeyDown={handleEditKeyPress}
                                      className={`w-full px-3 py-2 rounded-lg border-2 ${currentTheme.border} ${currentTheme.focus} focus:outline-none ${currentTheme.bgPrimary} ${currentTheme.textPrimary} resize-none`}
                                      rows="3"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={saveEditedTask}
                                        className={`px-3 py-1 rounded ${currentTheme.buttonPrimary} text-white text-sm`}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingTask(null)}
                                        className={`px-3 py-1 rounded ${currentTheme.buttonSecondary} ${currentTheme.textSecondary} text-sm`}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div onDoubleClick={() => handleDoubleClick(task)}>
                                    <span
                                      className={`${task.completed
                                        ? `${currentTheme.textLight} line-through`
                                        : currentTheme.textPrimary
                                        } whitespace-pre-wrap break-words`}
                                    >
                                      {renderTextWithLinks(task.text)}
                                    </span>
                                    {(task.pinned === 'none' || task.pinned === 'local') && task.dueDate && (
                                      <div className={`text-xs ${currentTheme.textLight} mt-1`}>
                                        Due: {formatDate(task.dueDate)}
                                      </div>
                                    )}
                                    {task.pinned === 'global' && task.createdAt && (
                                      <div className={`text-xs ${currentTheme.textLight} mt-1`}>
                                        Created: {formatDate(task.createdAt)}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 ml-2">
                              <div className="relative">
                                <select
                                  value={task.pinned}
                                  onChange={(e) => setPinMode(task.id, e.target.value)}
                                  className={`appearance-none bg-transparent ${currentTheme.textSecondary} hover:text-purple-800 cursor-pointer pr-6`}
                                >
                                  <option value="none">None</option>
                                  <option value="global">Global</option>
                                  <option value="local">Local</option>
                                </select>
                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  {task.pinned === 'global' && <Globe size={16} className={currentTheme.textSecondary} />}
                                  {task.pinned === 'local' && <MapPin size={16} className={currentTheme.textSecondary} />}
                                  {task.pinned === 'none' && <Pin size={16} className={currentTheme.textLight} />}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  {archivedTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`${currentTheme.textLight} mb-4`}>
                        <Archive size={48} className="mx-auto" />
                      </div>
                      <p className={currentTheme.textMuted}>No archived tasks yet.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {[...archivedTasks]
                        .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
                        .map((task) => (
                          <li
                            key={task.id}
                            className={`flex items-start justify-between p-4 rounded-xl ${currentTheme.bgSecondary} border ${currentTheme.border}`}
                          >
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`w-6 h-6 rounded-full border-2 ${currentTheme.border} flex items-center justify-center mt-1 flex-shrink-0`}>
                                <Check size={16} className={currentTheme.textSecondary} />
                              </div>
                              <div className="flex-1">
                                <span className={`${currentTheme.textLight} line-through whitespace-pre-wrap break-words`}>
                                  {renderTextWithLinks(task.text)}
                                </span>
                                <div className={`text-xs ${currentTheme.textLight} mt-1`}>
                                  Archived: {formatDate(task.archivedAt)}
                                </div>
                                {task.dueDate && (
                                  <div className={`text-xs ${currentTheme.textLight}`}>
                                    Due: {formatDate(task.dueDate)}
                                  </div>
                                )}
                                {task.createdAt && (
                                  <div className={`text-xs ${currentTheme.textLight}`}>
                                    Created: {formatDate(task.createdAt)}
                                  </div>
                                )}
                                {task.pinned === 'global' && (
                                  <div className={`text-xs ${currentTheme.textLight}`}>
                                    Global pinned
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 ml-2">
                              <button
                                onClick={() => restoreTask(task)}
                                className={`${currentTheme.textSecondary} hover:text-purple-800 transition-colors mt-1`}
                              >
                                <List size={20} />
                              </button>
                              <button
                                onClick={() => deleteArchivedTask(task.id)}
                                className={`${currentTheme.textLight} hover:${currentTheme.textSecondary} transition-colors mt-1`}
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.bgPrimary} rounded-2xl shadow-xl w-full max-w-md`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${currentTheme.textPrimary}`}>Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`${currentTheme.textLight} hover:${currentTheme.textSecondary}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Locale Setting */}
                <div>
                  <label className={`block ${currentTheme.textPrimary} font-medium mb-2`}>
                    Language & Region
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${currentTheme.border} ${currentTheme.focus} focus:outline-none ${currentTheme.bgPrimary} ${currentTheme.textPrimary}`}
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="en-GB">English (United Kingdom)</option>
                    <option value="de-DE">Deutsch (Deutschland)</option>
                    <option value="fr-FR">Français (France)</option>
                    <option value="es-ES">Español (España)</option>
                    <option value="ru-RU">Русский (Россия)</option>
                    <option value="zh-CN">中文 (中国)</option>
                    <option value="ja-JP">日本語 (日本)</option>
                  </select>
                </div>

                {/* Theme Setting */}
                <div>
                  <label className={`block ${currentTheme.textPrimary} font-medium mb-2`}>
                    Theme Color
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(themes).map((themeKey) => (
                      <button
                        key={themeKey}
                        onClick={() => setTheme(themeKey)}
                        className={`p-4 rounded-xl border-2 transition-colors ${theme === themeKey
                          ? `border-purple-500 ring-2 ring-purple-300`
                          : `${themes[themeKey].border} hover:ring-2 hover:ring-purple-200`
                          } ${themes[themeKey].bgPrimary}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full bg-${themes[themeKey].primary}-500`}></div>
                          <span className={`capitalize ${themes[themeKey].textPrimary}`}>
                            {themeKey}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Week Start Setting */}
                <div>
                  <label className={`block ${currentTheme.textPrimary} font-medium mb-2`}>
                    First Day of Week
                  </label>
                  <select
                    value={weekStart}
                    onChange={(e) => setWeekStart(parseInt(e.target.value))}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${currentTheme.border} ${currentTheme.focus} focus:outline-none ${currentTheme.bgPrimary} ${currentTheme.textPrimary}`}
                  >
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowSettings(false)}
                  className={`flex-1 px-4 py-3 rounded-xl ${currentTheme.buttonSecondary} ${currentTheme.textSecondary} ${currentTheme.buttonSecondaryHover}`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className={`flex-1 px-4 py-3 rounded-xl ${currentTheme.buttonPrimary} text-white ${currentTheme.buttonPrimaryHover}`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
