import React, { useState, useEffect, useRef } from 'react';
// import './App.css'
import { Plus, Trash2, Check, Pin, PinOff, Archive, List, Send, Shield, Settings, X, Eye, EyeOff, LoaderCircle } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const [customColor, setCustomColor] = useState('#8b5cf6');
  const [hideGlobal, setHideGlobal] = useState(false);
  const [hideLocal, setHideLocal] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [nsfwTags, setNsfwTags] = useState(''); // comma-separated string
  const [revealedNsfw, setRevealedNsfw] = useState({});
  const [pinMode, setPinMode] = useState('none');
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const textareaRef = useRef(null);
  const editInputRef = useRef(null);

  // Base theme colors
  const themes = {
    purple: {
      name: 'Purple',
      color: '#8b5cf6'
    },
    blue: {
      name: 'Blue',
      color: '#3b82f6'
    },
    green: {
      name: 'Green',
      color: '#22c55e'
    },
    pink: {
      name: 'Pink',
      color: '#ec4899'
    }
  };

  // Color manipulation and theme generation
  const hexToHSL = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = "0x" + hex[1] + hex[1];
      g = "0x" + hex[2] + hex[2];
      b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
      r = "0x" + hex[1] + hex[2];
      g = "0x" + hex[3] + hex[4];
      b = "0x" + hex[5] + hex[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;
    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return { h, s, l };
  };

  const hslToCss = (h, s, l, a = 1) => `hsl(${h} ${s}% ${l}% / ${a})`;

  const generatePaletteFromHex = React.useCallback((baseHex) => {
    const { h, s, l } = hexToHSL(baseHex);
    const safeSat = Math.max(10, s); // Ensure there's some saturation for grayscale colors

    return {
      primary: baseHex,
      gradientFrom: hslToCss(h, safeSat, 97),
      gradientTo: hslToCss(h, safeSat, 95),
      bgPrimary: hslToCss(h, safeSat, 97),
      bgSecondary: hslToCss(h, safeSat, 94),
      textPrimary: hslToCss(h, Math.min(90, s * 1.2), 25),
      textSecondary: hslToCss(h, s, 40),
      textMuted: hslToCss(h, s * 0.8, 55),
      textLight: hslToCss(h, s * 0.7, 70),
      border: hslToCss(h, safeSat * 0.8, 90),
      focus: baseHex,
      buttonPrimary: baseHex,
      buttonPrimaryHover: hslToCss(h, s, l - 5),
      buttonSecondary: hslToCss(h, safeSat * 0.9, 94),
      buttonSecondaryHover: hslToCss(h, safeSat * 0.9, 91),
      ring: hslToCss(h, s, l + 20, 0.5),
      calendarToday: hslToCss(h, s, 85),
      calendarSelected: baseHex,
      calendarHover: hslToCss(h, safeSat, 91),
      textOnPrimary: l > 50 ? '#000' : '#fff',
      link: baseHex,
      linkHover: hslToCss(h, s, l - 10),
      switchInactive: hslToCss(h, safeSat * 0.5, 85),
      switchThumb: '#fff',
      borderUncompletedTask: hslToCss(h, safeSat * 0.5, 95),
      checkboxBorder: hslToCss(h, s, 70),
      checkboxBorderHover: baseHex,
      checkboxBorderCompleted: baseHex,
      selectHover: hslToCss(h, s, l - 10),
      themeSelectBorderActive: baseHex,
      themeSelectRingActive: hslToCss(h, s, l + 20, 0.5),
      themeSelectRingHover: hslToCss(h, safeSat, 91),
      buttonDanger: '#dc2626',
      buttonDangerHover: '#b91c1c',
      textDanger: '#b91c1c',
      borderDanger: '#fecaca',
    };
  }, []);

  const activePalette = React.useMemo(() => {
    const baseColor = theme === 'custom' ? customColor : themes[theme].color;
    return generatePaletteFromHex(baseColor);
  }, [theme, customColor, generatePaletteFromHex]);

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(activePalette)) {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    }
  }, [activePalette]);

  // Initialize IndexedDB
  useEffect(() => {
    const startLoaderTimer = new Date().getUTCMilliseconds();

    setIsLoaderVisible(true);

    const initDB = async () => {
      try {
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open('TaskManager', 5); // Increment version

          request.onerror = (event) => {
            reject(event.target.error);
          };

          request.onsuccess = (event) => {
            resolve(event.target.result);
          };

          request.onupgradeneeded = (event) => {
            const dbHandle = event.target.result;

            // Create tasks store if it doesn't exist
            if (!dbHandle.objectStoreNames.contains('tasks')) {
              const taskStore = dbHandle.createObjectStore('tasks', { keyPath: 'id' });
              taskStore.createIndex('completed', 'completed', { unique: false });
              taskStore.createIndex('pinned', 'pinned', { unique: false });
              taskStore.createIndex('createdAt', 'createdAt', { unique: false });
              taskStore.createIndex('dueDate', 'dueDate', { unique: false });
            }

            // Create archived store if it doesn't exist
            if (!dbHandle.objectStoreNames.contains('archived')) {
              const archivedStore = dbHandle.createObjectStore('archived', { keyPath: 'id' });
              archivedStore.createIndex('archivedAt', 'archivedAt', { unique: false });
            }

            // Create settings store if it doesn't exist
            if (!dbHandle.objectStoreNames.contains('settings')) {
              const settingsStore = dbHandle.createObjectStore('settings', { keyPath: 'id' });
              settingsStore.put({ id: 'locale', value: 'en-US' });
              settingsStore.put({ id: 'theme', value: 'purple' });
              settingsStore.put({ id: 'weekStart', value: 0 }); // Sunday by default
              settingsStore.put({ id: 'hideGlobal', value: false });
              settingsStore.put({ id: 'hideLocal', value: false });
              settingsStore.put({ id: 'customColor', value: '#8b5cf6' });
              settingsStore.put({ id: 'nsfwTags', value: '' });
            }
          };
        });

        setDb(database);
        await Promise.all([loadTasks(database), loadSettings(database)]);

      } catch (error) {
        console.error("Failed to initialize database:", error);
      } finally {
        if (new Date().getUTCMilliseconds() - startLoaderTimer > 400) {
          setIsLoading(false);
          setIsLoaderVisible(false);
        } else {
          setTimeout(() => {
            setIsLoading(false);
            setIsLoaderVisible(false);
          }, 400);
        }
      }
    };

    initDB();
  }, []);

  // Load settings from IndexedDB
  const loadSettings = (database) => {
    return new Promise((resolve, reject) => {
      if (!database) {
        return reject(new Error("Database connection not available."));
      }
      const transaction = database.transaction(['settings'], 'readonly');
      const settingsStore = transaction.objectStore('settings');
      const request = settingsStore.getAll();

      request.onerror = (event) => reject(event.target.error);

      request.onsuccess = () => {
        const settingsMap = new Map((request.result || []).map(item => [item.id, item.value]));
        setLocale(settingsMap.get('locale') ?? 'en-US');
        setTheme(settingsMap.get('theme') ?? 'purple');
        setWeekStart(settingsMap.get('weekStart') ?? 0);
        setCustomColor(settingsMap.get('customColor') ?? '#8b5cf6');
        setHideGlobal(settingsMap.get('hideGlobal') ?? false);
        setHideLocal(settingsMap.get('hideLocal') ?? false);
        setNsfwTags(settingsMap.get('nsfwTags') ?? '');
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
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
    return new Promise((resolve, reject) => {
      if (!database) {
        return reject(new Error("Database connection not available."));
      }
      const transaction = database.transaction(['tasks', 'archived'], 'readonly');
      const taskStore = transaction.objectStore('tasks');
      const archivedStore = transaction.objectStore('archived');

      const taskRequest = taskStore.getAll();
      const archivedRequest = archivedStore.getAll();

      taskRequest.onerror = (event) => reject(event.target.error);
      archivedRequest.onerror = (event) => reject(event.target.error);

      taskRequest.onsuccess = () => {
        setTasks(taskRequest.result || []);
      };

      archivedRequest.onsuccess = () => {
        setArchivedTasks(archivedRequest.result || []);
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
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
        pinned: pinMode, // 'none', 'global', 'local'
        createdAt: today.toISOString(),
        dueDate: dueDate
      };

      saveTaskToDB(newTask);
      setTasks([...tasks, newTask]);
      setInputValue('');
      setPinMode('none');
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

  const updatePinMode = (id, mode) => {
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
    // Hide global/local tasks if setting is enabled
    if (hideGlobal && task.pinned === 'global') return false;
    if (hideLocal && task.pinned === 'local') return false;

    // If a tag is selected, it's the primary filter.
    if (selectedTag) {
      const taskTags = (task.text.match(/#(\w+)/g) || []).map(t => t.substring(1));
      return taskTags.includes(selectedTag);
    }

    // Otherwise, use date-based filtering
    if (task.pinned === 'global') return true; // Already checked hideGlobal

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
    saveSetting('customColor', customColor);
    saveSetting('nsfwTags', nsfwTags);
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
    const regex = /(https?:\/\/[^\s]+|#\w+)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;
      if (part.startsWith('http')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-link)] hover:text-[var(--color-link-hover)] underline"
          >
            {part}
          </a>
        );
      }
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <button
            key={index}
            onClick={() => setSelectedTag(tag)}
            className="bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded-md text-sm mx-0.5 font-medium transition-colors hover:bg-[var(--color-button-secondary-hover)]"
          >
            {part}
          </button>
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

  // Memoized tag calculations
  const allTags = React.useMemo(() => {
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

  const nsfwTagList = React.useMemo(() => nsfwTags.split(',').map(t => t.trim()).filter(Boolean), [nsfwTags]);

  const checkIsNsfw = (text, tagsToHide) => {
    if (tagsToHide.length === 0) return false;
    const taskTags = (text.match(/#(\w+)/g) || []).map(t => t.substring(1));
    return taskTags.some(taskTag => tagsToHide.includes(taskTag));
  };

  const handleClearDatabase = () => {
    if (window.confirm('Are you absolutely sure you want to delete all data?\nThis action cannot be undone.')) {
      if (db) {
        // It's important to close the connection before deleting the database.
        // Otherwise, a "blocked" event will be fired.
        db.close();
      }
      const deleteRequest = indexedDB.deleteDatabase('TaskManager');

      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully.');
        alert('All data has been cleared. The application will now reload.');
        window.location.reload();
      };

      deleteRequest.onerror = (event) => {
        console.error('Error deleting database:', event.target.error);
        alert('Could not delete the database. Please check the console for errors.');
      };

      deleteRequest.onblocked = (event) => {
        console.warn('Database deletion blocked. Other connections are open.', event);
        alert('Could not delete the database because it is open in another tab. Please close all other tabs of this app and try again.');
      };
    }
  };

  if (isLoading) {
    // This prevents a flash of the full UI on fast loads
    // The loader itself will only appear after a short delay
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-gradient-from)] to-[var(--color-gradient-to)] flex items-center justify-center">
        {isLoaderVisible && (
          <div className="flex flex-col items-center gap-4">
            <LoaderCircle size={48} className="animate-spin text-[var(--color-primary)]" />
            <p className="text-[var(--color-text-secondary)]">Loading database...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-gradient-from)] to-[var(--color-gradient-to)]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sticky Calendar Section */}
          <div className="lg:w-1/3">
            <div className="sticky top-4 bg-[var(--color-bg-primary)] rounded-2xl shadow-lg p-6">
              <div className="flex flex-row gap-4 mb-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`flex grow items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${showArchived ?
                    'bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-button-primary-hover)]' :
                    'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}
                >
                  {showArchived ? <List size={20} /> : <Archive size={20} />}
                  {showArchived ? 'Active Tasks' : 'Archived Tasks'}
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-4 rounded-lg bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)]"
                >
                  <Settings size={20} />
                </button>
              </div>

              {/* Calendar */}
              <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-2 rounded-lg bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)]"
                  >
                    &lt;
                  </button>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">
                    {formatDate(currentDate, { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)]"
                  >
                    &gt;
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {getWeekdayNames().map((day, index) => (
                    <div key={index} className="text-center text-[var(--color-text-secondary)] text-sm font-medium py-1">
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
                        className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative ${isSelected
                          ? 'bg-[var(--color-calendar-selected)] text-[var(--color-text-on-primary)]'
                          : isToday ? 'bg-[var(--color-calendar-today)] border-2 border-[var(--color-calendar-selected)]' : 'hover:bg-[var(--color-calendar-hover)]'
                          }
                          ${taskCount > 0 ? 'font-bold' : ''}`}
                      >
                        <span>{day}</span>
                        {taskCount > 0 && (
                          <span className={`text-xs ${isSelected ? 'text-[var(--color-text-on-primary)] text-opacity-80' : 'text-[var(--color-text-secondary)]'}`}>
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
                <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                  <Shield size={20} />
                  <button
                    onClick={toggleHideGlobal}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideGlobal ? 'bg-[var(--color-switch-inactive)]' : 'bg-[var(--color-button-primary)]'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-[var(--color-switch-thumb)] transition-transform ${hideGlobal ? 'translate-x-1' : 'translate-x-6'}`}
                    />
                  </button>
                </div>

                {/* Hide Local Tasks Switch */}
                <div className="flex items-center gap-1 ml-5 text-[var(--color-text-secondary)]">
                  <Pin size={20} />
                  <button
                    onClick={toggleHideLocal}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideLocal ? 'bg-[var(--color-switch-inactive)]' : 'bg-[var(--color-button-primary)]'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-[var(--color-switch-thumb)] transition-transform ${hideLocal ? 'translate-x-1' : 'translate-x-6'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Tag Cloud */}
              {allTags.length > 0 && !showArchived && (
                <div className="mt-6">
                  <h4 className="text-[var(--color-text-primary)] font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${selectedTag === tag ?
                          'bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)]' :
                          'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}
                      >
                        #{tag} <span className={`${selectedTag === tag ? 'opacity-70' : 'text-[var(--color-text-light)]'}`}>{count}</span>
                      </button>
                    ))}
                    {selectedTag && (
                      <button onClick={() => setSelectedTag(null)} className="p-1 rounded-full bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)]">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
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
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-[var(--color-border)] focus:border-[var(--color-focus)] focus:outline-none transition-colors resize-none min-h-[60px] max-h-64 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    rows="2"
                  />
                  <button
                    onClick={addTask}
                    disabled={!inputValue.trim()}
                    className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors duration-200 ${inputValue.trim() ?
                      'bg-[var(--color-button-primary)] hover:bg-[var(--color-button-primary-hover)] text-[var(--color-text-on-primary)]' :
                      'bg-[var(--color-bg-secondary)] text-[var(--color-text-light)] cursor-not-allowed'}`}
                  >
                    <Send size={20} />
                  </button>
                </div>
                <div className="mt-3 flex justify-center items-center gap-4">
                  <button onClick={() => setPinMode('none')} title="Pin: None" className={`p-2 rounded-full transition-colors ${pinMode === 'none' ? 'bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)]' : 'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}>
                    <PinOff size={16} />
                  </button>
                  <button onClick={() => setPinMode('global')} title="Pin: Global" className={`p-2 rounded-full transition-colors ${pinMode === 'global' ? 'bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)]' : 'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}>
                    <Shield size={16} />
                  </button>
                  <button onClick={() => setPinMode('local')} title="Pin: Local" className={`p-2 rounded-full transition-colors ${pinMode === 'local' ? 'bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)]' : 'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}>
                    <Pin size={16} />
                  </button>
                </div>
                <div className="text-xs text-[var(--color-text-light)] mt-2 text-center">
                  Press Enter to submit, Shift+Enter for new line
                </div>
              </div>
            </div>
            {/* Task Counters */}
            <div className="mt-4 text-center text-[var(--color-text-secondary)] text-sm">
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
            <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <p className="text-[var(--color-text-secondary)]">
                  {showArchived
                    ? `Archived - ${archivedTasks.length} tasks`
                    : selectedTag
                      ? `Tasks with #${selectedTag} - ${activeTasks.length} tasks`
                      : `${formatDate(selectedDate)} - ${activeTasks.length} tasks`}
                </p>
              </div>

              {!showArchived ? (
                <>
                  {sortedTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-[var(--color-text-light)] mb-4">
                        <Check size={48} className="mx-auto" />
                      </div>
                      <p className="text-[var(--color-text-muted)]">
                        No tasks for {formatDate(selectedDate)}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {sortedTasks.map((task) => {
                        const isNsfw = checkIsNsfw(task.text, nsfwTagList);
                        const isRevealed = revealedNsfw[task.id];

                        return (
                          <li
                            key={task.id}
                            className={`flex items-start justify-between p-4 rounded-xl transition-all duration-200 bg-[var(--color-bg-secondary)] border ${task.completed
                              ? 'border-[var(--color-border)]'
                              : 'border-[var(--color-border-uncompleted-task)]'
                              } ${task.pinned !== 'none' ? 'ring-2 ring-[var(--color-ring)]' : ''}`}
                          >
                            <div className="flex items-start space-x-3 flex-1">
                              <button
                                onClick={() => toggleComplete(task.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-1 flex-shrink-0 ${task.completed ?
                                  'bg-[var(--color-button-primary)] border-[var(--color-checkbox-border-completed)] text-[var(--color-text-on-primary)]' :
                                  'border-[var(--color-checkbox-border)] hover:border-[var(--color-checkbox-border-hover)]'}`}
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
                                      className="w-full px-3 py-2 rounded-lg border-2 border-[var(--color-border)] focus:border-[var(--color-focus)] focus:outline-none bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] resize-none"
                                      rows="3"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={saveEditedTask}
                                        className="px-3 py-1 rounded bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)] text-sm"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingTask(null)}
                                        className="px-3 py-1 rounded bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  isNsfw && !isRevealed ? (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-opacity-50">
                                      <span className="text-[var(--color-text-muted)]">Content hidden (NSFW tag)</span>
                                      <button
                                        onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: true }))}
                                        className="px-2 py-1 rounded bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] text-sm flex items-center gap-1 hover:bg-[var(--color-button-secondary-hover)]"
                                      >
                                        <Eye size={14} /> Show
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="relative" onDoubleClick={() => handleDoubleClick(task)}>
                                      {isNsfw && isRevealed && (
                                        <button
                                          onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: false }))}
                                          className="absolute -top-2 -right-2 p-1 rounded-full bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]"
                                          title="Hide content"
                                        >
                                          <EyeOff size={14} />
                                        </button>
                                      )}
                                      <span
                                        className={`${task.completed ?
                                          'text-[var(--color-text-light)] line-through' :
                                          'text-[var(--color-text-primary)]'
                                          } whitespace-pre-wrap break-words`}
                                      >
                                        {renderTextWithLinks(task.text)}
                                      </span>
                                      {(task.pinned === 'none' || task.pinned === 'local') && task.dueDate && (
                                        <div className="text-xs text-[var(--color-text-light)] mt-1">
                                          Due: {formatDate(task.dueDate)}
                                        </div>
                                      )}
                                      {task.pinned === 'global' && task.createdAt && (
                                        <div className="text-xs text-[var(--color-text-light)] mt-1">
                                          Created: {formatDate(task.createdAt)}
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 ml-2 self-center">
                              <div className="relative w-6 h-6 flex items-center justify-center">
                                <select
                                  value={task.pinned}
                                  onChange={(e) => updatePinMode(task.id, e.target.value)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  title={`Change pin mode (current: ${task.pinned})`}
                                >
                                  <option value="none">None</option>
                                  <option value="global">Global</option>
                                  <option value="local">Local</option>
                                </select>
                                <div className="pointer-events-none">
                                  {task.pinned === 'global' && <Shield size={16} className="text-[var(--color-text-secondary)]" />}
                                  {task.pinned === 'local' && <Pin size={16} className="text-[var(--color-text-secondary)]" />}
                                  {task.pinned === 'none' && <PinOff size={16} className="text-[var(--color-text-light)]" />}
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
                      <div className="text-[var(--color-text-light)] mb-4">
                        <Archive size={48} className="mx-auto" />
                      </div>
                      <p className="text-[var(--color-text-muted)]">No archived tasks yet.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {[...archivedTasks]
                        .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
                        .map((task) => (
                          <li
                            key={task.id}
                            className="flex items-start justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                          >
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center mt-1 flex-shrink-0">
                                <button
                                  onClick={() => restoreTask(task)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-1 flex-shrink-0 ${task.completed ?
                                    'bg-[var(--color-button-primary)] border-[var(--color-checkbox-border-completed)] text-[var(--color-text-on-primary)]' :
                                    'border-[var(--color-checkbox-border)] hover:border-[var(--color-checkbox-border-hover)]'}`}
                                >
                                  {task.completed && <Check size={16} />}
                                </button>
                              </div>
                              <div className="flex-1">
                                <span className="text-[var(--color-text-light)] line-through whitespace-pre-wrap break-words">
                                  {renderTextWithLinks(task.text)}
                                </span>
                                <div className="text-xs text-[var(--color-text-light)] mt-1">
                                  Archived: {formatDate(task.archivedAt)}
                                </div>
                                {task.dueDate && (
                                  <div className="text-xs text-[var(--color-text-light)]">
                                    Due: {formatDate(task.dueDate)}
                                  </div>
                                )}
                                {task.createdAt && (
                                  <div className="text-xs text-[var(--color-text-light)]">
                                    Created: {formatDate(task.createdAt)}
                                  </div>
                                )}
                                {task.pinned === 'global' && (
                                  <div className="text-xs text-[var(--color-text-light)]">
                                    Global pinned
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 ml-2">
                              <button
                                onClick={() => deleteArchivedTask(task.id)}
                                className="text-[var(--color-text-light)] hover:text-[var(--color-text-secondary)] transition-colors mt-1"
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
          <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[var(--color-text-light)] hover:text-[var(--color-text-secondary)]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Locale Setting */}
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-2">
                    Language & Region
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:border-[var(--color-focus)] focus:outline-none bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
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

                {/* NSFW Tags Setting */}
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-2">
                    NSFW Tags
                  </label>
                  <textarea
                    value={nsfwTags}
                    onChange={(e) => setNsfwTags(e.target.value)}
                    placeholder="Enter comma-separated tags to hide, e.g., work,secret"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:border-[var(--color-focus)] focus:outline-none bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] resize-y"
                    rows="3"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Tasks containing these tags will be hidden by default.
                  </p>
                </div>

                {/* Theme Setting */}
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-2">
                    Theme Color
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.keys(themes).map((themeKey) => (
                      <button
                        key={themeKey}
                        onClick={() => setTheme(themeKey)}
                        className={`p-4 rounded-xl border-2 transition-colors bg-[var(--color-bg-primary)] ${theme === themeKey
                          ? 'border-[var(--color-theme-select-border-active)] ring-2 ring-[var(--color-theme-select-ring-active)]'
                          : 'border-[var(--color-border)] hover:ring-2 hover:ring-[var(--color-theme-select-ring-hover)]'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: themes[themeKey].color }}></div>
                          <span className="capitalize text-[var(--color-text-primary)]">
                            {themes[themeKey].name}
                          </span>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => setTheme('custom')}
                      className={`p-4 rounded-xl border-2 transition-colors bg-[var(--color-bg-primary)] ${theme === 'custom'
                        ? 'border-[var(--color-theme-select-border-active)] ring-2 ring-[var(--color-theme-select-ring-active)]'
                        : 'border-[var(--color-border)] hover:ring-2 hover:ring-[var(--color-theme-select-ring-hover)]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"></div>
                        <span className="capitalize text-[var(--color-text-primary)]">
                          Custom
                        </span>
                      </div>
                    </button>
                  </div>
                  {theme === 'custom' && (
                    <div className="mt-4 flex items-center gap-4">
                      <label htmlFor="customColorPicker" className="text-[var(--color-text-secondary)]">Pick a color:</label>
                      <input
                        id="customColorPicker"
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-12 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Week Start Setting */}
                <div>
                  <label className="block text-[var(--color-text-primary)] font-medium mb-2">
                    First Day of Week
                  </label>
                  <select
                    value={weekStart}
                    onChange={(e) => setWeekStart(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border)] focus:border-[var(--color-focus)] focus:outline-none bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
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

                {/* Danger Zone */}
                <div className="border-t pt-6 mt-6 border-[var(--color-border-danger)]">
                  <label className="block text-[var(--color-text-danger)] font-medium mb-2">
                    Danger Zone
                  </label>
                  <button
                    onClick={handleClearDatabase}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-button-danger)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-button-danger-hover)] transition-colors"
                  >
                    Clear All Data
                  </button>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    This will permanently delete all your tasks, archives, and settings. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-button-primary-hover)]"
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
