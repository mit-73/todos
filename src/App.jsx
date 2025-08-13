import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Check, Pin, PinOff, Archive, List, Send, Shield, Settings, X, Eye, EyeOff, LoaderCircle, Star, Grid, Flame, Clock, Edit3, ChevronLeft, Play, Square, Coffee, Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

const MiniPomodoroTimer = ({ pomodoro, onReset }) => {
  const { timeLeft, duration, mode } = pomodoro;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const isWork = mode === 'work';

  return (
    <div className="mt-3 pt-3 border-t border-light-text/10 dark:border-dark-text/10">
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="font-semibold flex items-center gap-1.5 text-light-text-muted dark:text-dark-text-muted">
          {isWork ? (
            <Flame size={14} className="text-light-primary animate-pulse" />
          ) : (
            <Coffee size={14} className="text-green-500" />
          )}
          <span>{isWork ? 'Focus Session' : 'On a Break'}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-base text-light-text dark:text-dark-text">{minutes}:{seconds}</span>
          {onReset && (
            <button onClick={onReset} className="p-1.5 rounded-full text-light-danger dark:text-dark-danger hover:bg-red-500/10 transition-colors" title="Stop Session">
              <Square size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="w-full bg-light-text/10 dark:bg-dark-text/10 rounded-full h-2 shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark">
        <div className={`${isWork ? 'bg-light-primary' : 'bg-green-500'} h-2 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [db, setDb] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const [showSettings, setShowSettings] = useState(false);
  const [locale, setLocale] = useState('ru-RU');
  const [theme, setThemeState] = useState('system'); // 'light', 'dark', 'system'
  const [weekStart, setWeekStart] = useState(0); // 0 = Sunday, 1 = Monday
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const [hideGlobal, setHideGlobal] = useState(false);
  const [hideLocal, setHideLocal] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [nsfwTags, setNsfwTags] = useState('');
  const [revealedNsfw, setRevealedNsfw] = useState({});
  const [pinMode, setPinMode] = useState('none');
  const [isUrgent, setIsUrgent] = useState(false); // For new tasks
  const [isImportant, setIsImportant] = useState(false); // For new tasks
  const [viewMode, setViewMode] = useState('list'); // 'list', 'matrix', or 'planner'
  const [timeFilterMode, setTimeFilterMode] = useState('day'); // 'day', 'month', 'quarter', 'year', 'all'
  const [calendarViewMode, setCalendarViewMode] = useState('days'); // 'days', 'months', 'years'
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [highlightedTagIndex, setHighlightedTagIndex] = useState(0);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);
  const editInputRef = useRef(null);

  // --- Day Planner State ---
  const [plannerBlocks, setPlannerBlocks] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const initialPomodoroState = {
    isActive: false,
    isPaused: true,
    blockId: null,
    mode: 'work', // 'work' or 'break'
    timeLeft: 0,
    duration: 0,
    queue: [],
    currentSliceIndex: -1,
  };

  // --- Pomodoro State (Global) ---
  const [pomodoro, setPomodoro] = useState(initialPomodoroState);

  const setTheme = (newTheme) => {
    saveSetting('theme', newTheme);
    setThemeState(newTheme);
  };

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

  const playSound = (soundFile) => {
    try {
      // NOTE: You need to place sound files in your public folder, e.g., /public/sounds/
      const audio = new Audio(soundFile);
      audio.play();
    } catch (e) {
      console.error("Could not play sound. Make sure the sound file exists in the public folder.", e);
    }
  };

  const startPomodoro = (blockId) => {
    const block = plannerBlocks.find(b => b.id === blockId);
    if (!block) return;

    const now = new Date();
    const [endHours, endMinutes] = block.endTime.split(':').map(Number);
    const endBlock = new Date(now);
    endBlock.setHours(endHours, endMinutes, 0, 0);

    let remainingSeconds = Math.floor((endBlock.getTime() - now.getTime()) / 1000);
    if (remainingSeconds <= 60) { // Don't start if less than a minute left
      alert("Not enough time in the block to start a focus session.");
      return;
    }

    const workSeconds = (workSettings.pomodoroWorkDuration || 25) * 60;
    const breakSeconds = (workSettings.pomodoroBreakDuration || 5) * 60;
    const newQueue = [];

    while (remainingSeconds >= workSeconds) {
      newQueue.push({ mode: 'work', duration: workSeconds });
      remainingSeconds -= workSeconds;

      if (remainingSeconds > 0) {
        const currentBreakDuration = Math.min(remainingSeconds, breakSeconds);
        newQueue.push({ mode: 'break', duration: currentBreakDuration });
        remainingSeconds -= currentBreakDuration;
      }
    }

    if (remainingSeconds > 60) {
      newQueue.push({ mode: 'work', duration: remainingSeconds });
    }

    if (newQueue.length === 0) {
      newQueue.push({ mode: 'work', duration: remainingSeconds });
    }

    const firstSlice = newQueue[0];
    playSound('/sounds/work-start.mp3');
    setPomodoro({
      isActive: true,
      isPaused: false,
      blockId: blockId,
      mode: firstSlice.mode,
      timeLeft: firstSlice.duration,
      duration: firstSlice.duration,
      queue: newQueue,
      currentSliceIndex: 0,
    });
  };

  const resetPomodoro = (confirm = false) => {
    if (confirm && pomodoro.isActive && !window.confirm('Are you sure you want to stop the focus session?')) {
      return;
    }
    setPomodoro(initialPomodoroState);
  };

  const handleResetPomodoro = () => resetPomodoro(true);

  const activePlannerBlocks = React.useMemo(() => {
    const now = currentTime;
    return plannerBlocks.filter(block => {
      if (!block.startTime || !block.endTime) return false;
      const [startHours, startMinutes] = block.startTime.split(':').map(Number);
      const [endHours, endMinutes] = block.endTime.split(':').map(Number);

      const startBlock = new Date(now);
      startBlock.setHours(startHours, startMinutes, 0, 0);

      const endBlock = new Date(now);
      endBlock.setHours(endHours, endMinutes, 0, 0);

      return now >= startBlock && now < endBlock;
    });
  }, [currentTime, plannerBlocks]);

  const [workSettings, setWorkSettings] = useState({
    startTime: '09:00',
    endTime: '18:00',
    pomodoroWorkDuration: 25,
    pomodoroBreakDuration: 5,
  });

  // Initialize IndexedDB
  useEffect(() => {
    const startLoaderTimer = new Date().getUTCMilliseconds();

    setIsLoaderVisible(true);

    // Update current time every minute for the planner
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    const initDB = async () => {
      try {
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open('TaskManager', 8); // DB version bump for planner

          request.onerror = (event) => {
            reject(event.target.error);
            console.error("Database error:", event.target.error);
            alert("Error opening database. Check console for details.");
          };

          request.onsuccess = (event) => {
            resolve(event.target.result);
          };

          request.onupgradeneeded = (event) => {
            const dbHandle = event.target.result;
            const transaction = event.target.transaction;

            // Create/update tasks store
            let taskStore;
            if (!dbHandle.objectStoreNames.contains('tasks')) {
              taskStore = dbHandle.createObjectStore('tasks', { keyPath: 'id' });
            } else {
              taskStore = transaction.objectStore('tasks');
            }

            // Add new indexes if they don't exist
            if (!taskStore.indexNames.contains('completed')) taskStore.createIndex('completed', 'completed', { unique: false });
            if (!taskStore.indexNames.contains('pinned')) taskStore.createIndex('pinned', 'pinned', { unique: false });
            if (!taskStore.indexNames.contains('createdAt')) taskStore.createIndex('createdAt', 'createdAt', { unique: false });
            if (!taskStore.indexNames.contains('dueDate')) taskStore.createIndex('dueDate', 'dueDate', { unique: false });
            if (!taskStore.indexNames.contains('importance')) taskStore.createIndex('importance', 'importance', { unique: false });
            if (!taskStore.indexNames.contains('urgency')) taskStore.createIndex('urgency', 'urgency', { unique: false });

            // Create archived store if it doesn't exist
            if (!dbHandle.objectStoreNames.contains('archived')) dbHandle.createObjectStore('archived', { keyPath: 'id' });

            // Create settings store if it doesn't exist
            if (!dbHandle.objectStoreNames.contains('settings')) {
              const settingsStore = dbHandle.createObjectStore('settings', { keyPath: 'id' });
              settingsStore.put({ id: 'locale', value: 'ru-RU' });
              settingsStore.put({ id: 'theme', value: 'system' });
              settingsStore.put({ id: 'weekStart', value: 0 }); // Sunday by default
              settingsStore.put({ id: 'hideGlobal', value: false });
              settingsStore.put({ id: 'hideLocal', value: false });
              settingsStore.put({ id: 'nsfwTags', value: '' });
            }

            // Create planner stores if they don't exist
            if (!dbHandle.objectStoreNames.contains('plannerBlocks')) {
              dbHandle.createObjectStore('plannerBlocks', { keyPath: 'id' });
            }
            if (!dbHandle.objectStoreNames.contains('plannerSettings')) {
              const plannerSettingsStore = dbHandle.createObjectStore('plannerSettings', { keyPath: 'id' });
              plannerSettingsStore.put({ id: 'workTime', value: { startTime: '09:00', endTime: '18:00' } });
            }
          };
        });

        setDb(database);
        // Load all data
        await Promise.all([loadTasks(database), loadSettings(database), loadPlannerData(database)]);

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

    return () => clearInterval(timer);
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
        setLocale(settingsMap.get('locale') ?? 'ru-RU');
        setThemeState(settingsMap.get('theme') ?? 'system');
        setWeekStart(settingsMap.get('weekStart') ?? 0);
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

  // --- Planner DB Functions ---
  const loadPlannerData = (database) => {
    return new Promise((resolve, reject) => {
      if (!database) return reject(new Error("Database not available"));
      const transaction = database.transaction(['plannerBlocks', 'plannerSettings'], 'readonly');
      const blockStore = transaction.objectStore('plannerBlocks');
      const settingsStore = transaction.objectStore('plannerSettings');

      const blockRequest = blockStore.getAll();
      const settingsRequest = settingsStore.get('workTime');

      blockRequest.onsuccess = () => setPlannerBlocks(blockRequest.result || []);
      settingsRequest.onsuccess = () => {
        if (settingsRequest.result) {
          setWorkSettings(settingsRequest.result.value);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = (e) => reject(e.target.error);
    });
  };

  const savePlannerBlockToDB = (block) => {
    if (!db) return;
    const transaction = db.transaction(['plannerBlocks'], 'readwrite');
    transaction.objectStore('plannerBlocks').put(block);
  };

  const deletePlannerBlockFromDB = (id) => {
    if (!db) return;
    const transaction = db.transaction(['plannerBlocks'], 'readwrite');
    transaction.objectStore('plannerBlocks').delete(id);
  };

  const savePlannerSettingsToDB = (settings) => {
    if (!db) return;
    const transaction = db.transaction(['plannerSettings'], 'readwrite');
    transaction.objectStore('plannerSettings').put({ id: 'workTime', value: settings });
  };

  const handleSavePlannerSettings = (newSettings) => {
    setWorkSettings(newSettings);
    savePlannerSettingsToDB(newSettings);
  };

  useEffect(() => {
    if (!pomodoro.isActive || pomodoro.isPaused) return;

    const interval = setInterval(() => {
      // Check if the block itself has ended or was deleted, which forces the session to stop.
      const associatedBlock = plannerBlocks.find(b => b.id === pomodoro.blockId);
      if (associatedBlock) {
        const now = new Date();
        const [endHours, endMinutes] = associatedBlock.endTime.split(':').map(Number);
        const endBlock = new Date(now);
        endBlock.setHours(endHours, endMinutes, 0, 0);
        if (now >= endBlock) {
          clearInterval(interval);
          alert('Focus session stopped because the scheduled block has ended.');
          resetPomodoro(false);
          return;
        }
      } else { // Block was deleted
        clearInterval(interval);
        resetPomodoro(false);
        return;
      }

      setPomodoro(p => {
        if (p.timeLeft > 1) {
          return { ...p, timeLeft: p.timeLeft - 1 };
        }

        // Time's up for the current slice, transition to the next
        const nextSliceIndex = p.currentSliceIndex + 1;
        if (nextSliceIndex >= p.queue.length) {
          clearInterval(interval);
          playSound('/sounds/session-end.mp3');
          alert('Full focus session complete!');
          return initialPomodoroState;
        }

        const nextSlice = p.queue[nextSliceIndex];
        playSound(nextSlice.mode === 'work' ? '/sounds/work-start.mp3' : '/sounds/break-start.mp3');

        return {
          ...p,
          currentSliceIndex: nextSliceIndex,
          mode: nextSlice.mode,
          timeLeft: nextSlice.duration,
          duration: nextSlice.duration,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoro.isActive, pomodoro.isPaused, pomodoro.blockId, plannerBlocks, initialPomodoroState]);
  // --- End Planner DB Functions ---


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
        pinned: pinMode,
        urgency: isUrgent,
        importance: isImportant,
        createdAt: today.toISOString(),
        dueDate: dueDate
      };

      saveTaskToDB(newTask);
      setTasks([...tasks, newTask]);
      setInputValue('');
      setPinMode('none');
      setIsUrgent(false);
      setIsImportant(false);
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

  const toggleImportance = (id) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, importance: !task.importance };
        saveTaskToDB(updatedTask);
        return updatedTask;
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  const toggleUrgency = (id) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, urgency: !task.urgency };
        saveTaskToDB(updatedTask);
        return updatedTask;
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  const selectTagSuggestion = (selectedTag) => {
    if (!textareaRef.current) return;
    const { value, selectionStart } = textareaRef.current;

    const textBeforeCursor = value.slice(0, selectionStart);
    const lastWordStartIndex = textBeforeCursor.search(/#\S*$/);
    const textAfterCursor = value.slice(selectionStart);

    const newValue =
      value.slice(0, lastWordStartIndex) +
      '#' +
      selectedTag +
      ' ' +
      textAfterCursor;

    setInputValue(newValue);
    setShowTagSuggestions(false);

    // Refocus and set cursor position
    setTimeout(() => {
      if (!textareaRef.current) return;
      const newCursorPosition = (value.slice(0, lastWordStartIndex) + '#' + selectedTag + ' ').length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleInputChange = (e) => {
    const { value, selectionStart } = e.target;
    setInputValue(value);

    // Find the word the cursor is currently in or at the end of
    const textBeforeCursor = value.slice(0, selectionStart);
    const lastWordStartIndex = textBeforeCursor.search(/#\S*$/);

    if (lastWordStartIndex !== -1) {
      const currentTagQuery = textBeforeCursor.slice(lastWordStartIndex + 1);
      const suggestions = allTags
        .map(([tag]) => tag)
        .filter(tag =>
          tag.toLowerCase().startsWith(currentTagQuery.toLowerCase())
        );

      if (suggestions.length > 0) {
        setTagSuggestions(suggestions);
        setShowTagSuggestions(true);
        setHighlightedTagIndex(0); // Reset to first item
      } else {
        setShowTagSuggestions(false);
      }
    } else {
      setShowTagSuggestions(false);
    }
  };

  const handleKeyPress = (e) => {
    if (showTagSuggestions && tagSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedTagIndex(prev => (prev + 1) % tagSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedTagIndex(prev => (prev - 1 + tagSuggestions.length) % tagSuggestions.length);
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
        e.preventDefault();
        selectTagSuggestion(tagSuggestions[highlightedTagIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowTagSuggestions(false);
        return;
      }
    }

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

  const handleCalendarHeaderClick = () => {
    if (calendarViewMode === 'days') {
      setCalendarViewMode('months');
    } else if (calendarViewMode === 'months') {
      setCalendarViewMode('years');
    }
  };

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

  const selectDate = (day) => {
    const today = new Date();
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, today.getHours(), today.getMinutes(), today.getSeconds());
    setSelectedDate(newDate);
    setTimeFilterMode('day');
  };

  const selectMonth = (monthIndex) => {
    const newDate = new Date(currentDate.getFullYear(), monthIndex, 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
    // User stays in the month/quarter view to allow selecting different periods
    // without the view changing.
  };

  const selectYear = (year) => {
    const newDate = new Date(year, currentDate.getMonth(), 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
    // User stays in the year view to allow selecting different years.
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setCalendarViewMode('days');
  };

  // Filter tasks by selected date
  const filteredTasks = React.useMemo(() => tasks.filter(task => {
    // Hide global/local tasks if setting is enabled
    if (hideGlobal && task.pinned === 'global') return false;
    if (hideLocal && task.pinned === 'local') return false;

    const hasSelectedTag = selectedTag
      ? (task.text.match(/#(\w+)/g) || []).map(t => t.substring(1)).includes(selectedTag)
      : true; // If no tag is selected, all tasks pass this check.

    if (!hasSelectedTag) {
      return false;
    }

    // Global tasks are shown on all days if they match the tag filter (if any)
    if (task.pinned === 'global') {
      return true;
    }

    if (!task.dueDate) {
      return timeFilterMode === 'all';
    }
    const taskDueDate = new Date(task.dueDate);

    if (timeFilterMode === 'day') {
      return taskDueDate.toDateString() === selectedDate.toDateString();
    }

    const now = selectedDate; // Use selectedDate as the reference for month/quarter/year
    const taskYear = taskDueDate.getFullYear();
    const taskMonth = taskDueDate.getMonth();
    const taskQuarter = Math.floor(taskMonth / 3);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);

    if (timeFilterMode === 'month') return taskYear === currentYear && taskMonth === currentMonth;
    if (timeFilterMode === 'quarter') return taskYear === currentYear && taskQuarter === currentQuarter;
    if (timeFilterMode === 'year') return taskYear === currentYear;
    if (timeFilterMode === 'all') return true;
    return false;
  }), [tasks, hideGlobal, hideLocal, selectedTag, selectedDate, timeFilterMode]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        textareaRef.current && !textareaRef.current.contains(event.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target)
      ) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTaskListHeaderText = () => {
    if (selectedTag) {
      return `Tasks with #${selectedTag}`;
    }

    const now = selectedDate;
    const monthName = formatDate(now, { month: 'long' });
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    switch (timeFilterMode) {
      case 'day':
        return formatDate(selectedDate);
      case 'month':
        return `Tasks for ${monthName} ${year}`;
      case 'quarter':
        return `Tasks for Q${quarter} ${year}`;
      case 'year':
        return `Tasks for ${year}`;
      case 'all':
        return 'All Tasks';
      default:
        return formatDate(selectedDate);
    }
  };
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
            className="text-light-primary dark:text-dark-primary hover:underline"
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
            className="bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary px-1.5 py-0.5 rounded-md text-sm mx-0.5 font-medium transition-colors hover:bg-light-primary/20 dark:hover:bg-dark-primary/20"
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

  const isNowInTimeBlock = (startTime, endTime) => {
    const now = new Date();
    if (!startTime || !endTime) return false;
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startBlock = new Date(now);
    startBlock.setHours(startHours, startMinutes, 0, 0);

    const endBlock = new Date(now);
    endBlock.setHours(endHours, endMinutes, 0, 0);

    return now >= startBlock && now < endBlock;
  };

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

  const matrixTasks = React.useMemo(() => {
    // Use the already filtered activeTasks list to respect date/tag filters
    const doTasks = activeTasks.filter(t => t.importance && t.urgency);
    const scheduleTasks = activeTasks.filter(t => t.importance && !t.urgency);
    const delegateTasks = activeTasks.filter(t => !t.importance && t.urgency);
    const eliminateTasks = activeTasks.filter(t => !t.importance && !t.urgency);
    return { doTasks, scheduleTasks, delegateTasks, eliminateTasks };
  }, [activeTasks]);

  if (viewMode === 'planner') {
    return <DayPlannerView
      plannerBlocks={plannerBlocks}
      setPlannerBlocks={setPlannerBlocks}
      workSettings={workSettings}
      setWorkSettings={handleSavePlannerSettings}
      currentTime={currentTime}
      locale={locale}
      savePlannerBlockToDB={savePlannerBlockToDB}
      deletePlannerBlockFromDB={deletePlannerBlockFromDB}
      setViewMode={setViewMode}
      pomodoro={pomodoro}
      startPomodoro={startPomodoro}
      handleResetPomodoro={handleResetPomodoro}
    />;
  }

  if (isLoading) {
    // This prevents a flash of the full UI on fast loads
    // The loader itself will only appear after a short delay
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center transition-colors duration-300">
        {isLoaderVisible && (
          <div className="flex flex-col items-center gap-4">
            <LoaderCircle size={48} className="animate-spin text-light-primary dark:text-dark-primary" />
            <p className="text-light-text-muted dark:text-dark-text-muted">Loading database...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sticky Calendar Section */}
          <div className="lg:w-1/3">
            <div className="sticky top-8 bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6 flex flex-col">
              {/* Mini Planner View */}
              <div
                onClick={() => setViewMode('planner')}
                className="mb-4 p-4 rounded-xl shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark cursor-pointer transition-all"
              >
                <h4 className="text-sm font-semibold text-light-text-muted dark:text-dark-text-muted mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Today's Plan
                </h4>
                {activePlannerBlocks.length > 0 ? (
                  <div className="space-y-2">
                    {activePlannerBlocks.map(block => {
                      const progress = (() => {
                        const now = currentTime.getTime();
                        const start = new Date(currentTime);
                        start.setHours(...block.startTime.split(':').map(Number), 0, 0);
                        const end = new Date(currentTime);
                        end.setHours(...block.endTime.split(':').map(Number), 0, 0);
                        const totalDuration = end.getTime() - start.getTime();
                        if (totalDuration <= 0) return 100;
                        const elapsed = now - start.getTime();
                        return Math.min(100, (elapsed / totalDuration) * 100);
                      })();
                      return (
                        <div key={block.id} className="relative group">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-semibold truncate pr-2" title={block.title}>{block.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-light-text-muted dark:text-dark-text-muted flex-shrink-0">{block.startTime} - {block.endTime}</span>
                              {isNowInTimeBlock(block.startTime, block.endTime) && !pomodoro.isActive && (
                                <button onClick={(e) => { e.stopPropagation(); startPomodoro(block.id); }} className="p-1.5 rounded-full text-light-primary dark:text-dark-primary hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition-colors opacity-0 group-hover:opacity-100" title="Start Focus Session">
                                  <Play size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-light-text/10 dark:bg-dark-text/10 rounded-full h-2 shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark">
                            <div className={`${block.color.replace('border-', 'bg-')} h-2 rounded-full`} style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-light-text-muted dark:text-dark-text-muted py-2 text-sm">
                    <p>No active block. Time to plan!</p>
                  </div>
                )}
                {pomodoro.isActive && <MiniPomodoroTimer pomodoro={pomodoro} onReset={handleResetPomodoro} />}
              </div>

              {/* Global Pomodoro Timer is now inside the planner preview */}
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

                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-4 rounded-lg transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                >
                  <Settings size={20} />
                </button>
              </div>

              {/* Calendar */}
              <div className="rounded-xl p-4 mb-6 shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
                {/* Time Range Filter */}
                {!showArchived && (
                  <div className="mb-4">
                    <div className="flex p-1 rounded-xl shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
                      {[
                        { id: 'day', label: 'Day' },
                        { id: 'month', label: 'Month' },
                        { id: 'quarter', label: 'Quarter' },
                        { id: 'year', label: 'Year' },
                        { id: 'all', label: 'All Time' },
                      ].map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => {
                            setTimeFilterMode(filter.id);
                            if (filter.id === 'day' || filter.id === 'all') { setCalendarViewMode('days'); }
                            else if (filter.id === 'month' || filter.id === 'quarter') { setCalendarViewMode('months'); }
                            else if (filter.id === 'year') { setCalendarViewMode('years'); }
                          }}
                          className={`px-2 py-1.5 text-sm rounded-lg transition-all duration-200 flex-1 text-center font-semibold ${timeFilterMode === filter.id
                            ? 'text-light-primary dark:text-dark-primary shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'
                            : 'text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'
                            }`}
                        >{filter.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="min-h-[320px]">
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="ml-2 font-bold text-lg [text-shadow:1px_1px_1px_#fff,-1px_-1px_1px_#a3b1c6] dark:[text-shadow:1px_1px_1px_#373c43,-1px_-1px_1px_#21252a]">
                        {
                          calendarViewMode === 'days' ? formatDate(currentDate, { month: 'long', year: 'numeric' }) :
                            calendarViewMode === 'months' ? formatDate(currentDate, { year: 'numeric' }) :
                              `${Math.floor(currentDate.getFullYear() / 12) * 12} - ${Math.floor(currentDate.getFullYear() / 12) * 12 + 11}`
                        }
                      </h3>

                      <div className="flex items-center text-center text-light-text-muted dark:text-dark-text-muted text-sm font-medium rounded-lg">
                        <button onClick={() => handleCalendarNav(-1)} className="px-3 py-2 rounded-l-xl transition-all duration-150 hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark" title="Previous">&lt;</button>
                        <button onClick={goToToday} className="px-3 py-2 text-sm border-x border-light-text/10 dark:border-dark-text/10 transition-all duration-150 hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark" title="Go to Today">Today</button>
                        <button onClick={() => handleCalendarNav(1)} className="px-3 py-2 rounded-r-xl transition-all duration-150 hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark" title="Next">&gt;</button>
                      </div>

                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2 h-8 items-center">
                      {calendarViewMode === 'days' && getWeekdayNames().map((day, index) => (
                        <div key={index} className="text-center text-light-text-muted dark:text-dark-text-muted text-sm font-medium">
                          {day}
                        </div>
                      ))}
                    </div>

                    {calendarViewMode === 'days' && (
                      <div className="grid grid-cols-7 gap-1">
                        {[...Array(getFirstDayOfMonth(currentDate)).keys()].map(i => (
                          <div key={`empty-${i}`} className="h-10"></div>
                        ))}
                        {[...Array(getDaysInMonth(currentDate)).keys()].map(i => {
                          const day = i + 1;
                          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const isSelected = timeFilterMode === 'day' && date.toDateString() === selectedDate.toDateString();
                          const taskCount = getTasksForDate(date);
                          return (
                            <button
                              key={day}
                              onClick={() => selectDate(day)}
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
                                        onClick={() => selectMonth(monthIndex)}
                                        className={`py-4 w-1/3 text-center transition-all duration-150 ${isCurrentQuarterSelected
                                          ? `${borderRadiusClasses[indexInQuarter]} text-light-primary dark:text-dark-primary`
                                          : 'rounded-lg hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark'
                                          }`}
                                      >
                                        {formatDate(monthDate, { month: 'short' })}
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
                                onClick={() => selectMonth(monthIndex)}
                                className={`py-4 rounded-lg text-center transition-all duration-150 ${isSelected
                                  ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary'
                                  : 'hover:shadow-neumorphic-outset-sm dark:hover:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark'
                                  }`}
                              >
                                {formatDate(monthDate, { month: 'short' })}
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
                              onClick={() => selectYear(year)}
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
                  </>
                </div>
              </div>

              {!showArchived && (
                <div className="flex grid-cols-4">
                  {/* Hide Global Tasks Switch */}
                  <div className="flex items-center gap-2 text-light-text-muted dark:text-dark-text-muted">
                    <Shield size={20} />
                    <button
                      onClick={toggleHideGlobal}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${hideGlobal ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-all ${hideGlobal ? 'translate-x-1 bg-light-text-muted dark:bg-dark-text-muted' : 'translate-x-6 bg-light-primary'}`}
                      />
                    </button>
                  </div>

                  {/* Hide Local Tasks Switch */}
                  <div className="flex items-center gap-2 ml-5 text-light-text-muted dark:text-dark-text-muted">
                    <Pin size={20} />
                    <button
                      onClick={toggleHideLocal}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${hideLocal ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-all ${hideLocal ? 'translate-x-1 bg-light-text-muted dark:bg-dark-text-muted' : 'translate-x-6 bg-light-primary'}`}
                      />
                    </button>
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
              {/* Task Input */}
              {!showArchived && (
                <div className="mt-6 pt-4 border-t border-light-text/10 dark:border-dark-text/10">
                  <div className="relative">
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div ref={suggestionsRef} className="absolute bottom-full mb-2 w-full bg-light-surface dark:bg-dark-surface rounded-lg shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark z-10 max-h-48 overflow-y-auto">
                        <ul className="p-1">
                          {tagSuggestions.map((tag, index) => (
                            <li key={tag}>
                              <button
                                onClick={() => selectTagSuggestion(tag)}
                                onMouseOver={() => setHighlightedTagIndex(index)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm ${index === highlightedTagIndex
                                  ? 'bg-light-primary/20 dark:bg-dark-primary/20'
                                  : ''
                                  } hover:bg-light-primary/10 dark:hover:bg-dark-primary/10`}
                              >
                                #{tag}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      // disabled={selectedDate.getTime() < new Date().getTime()} TODO!
                      placeholder="Добавить новую задачу..."
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none transition-colors resize-none min-h-[60px] max-h-64"
                      rows="2"
                    />
                    <button
                      onClick={addTask}
                      disabled={!inputValue.trim()}
                      className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-150 ${inputValue.trim() ?
                        'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark text-light-primary' :
                        'text-light-text-muted dark:text-dark-text-muted cursor-not-allowed'}`}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  <div className="mt-3 flex justify-center items-center gap-4">
                    <button onClick={() => setPinMode('none')} title="Pin: None" className={`p-2 rounded-full transition-all duration-150 ${pinMode === 'none' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                      <PinOff size={16} />
                    </button>
                    <button onClick={() => setPinMode('global')} title="Pin: Global" className={`p-2 rounded-full transition-all duration-150 ${pinMode === 'global' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                      <Shield size={16} />
                    </button>
                    <button onClick={() => setPinMode('local')} title="Pin: Local" className={`p-2 rounded-full transition-all duration-150 ${pinMode === 'local' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                      <Pin size={16} />
                    </button>
                    <div className="border-l h-6 border-light-text/20 dark:border-dark-text/20 mx-2"></div>
                    <button onClick={() => setIsImportant(!isImportant)} title={`Mark as ${isImportant ? 'Not Important' : 'Important'}`} className={`p-2 rounded-full transition-all duration-150 ${isImportant ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-amber-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                      <Star size={16} className={`${isImportant ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button onClick={() => setIsUrgent(!isUrgent)} title={`Mark as ${isUrgent ? 'Not Urgent' : 'Urgent'}`} className={`p-2 rounded-full transition-all duration-150 ${isUrgent ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-orange-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                      <Flame size={16} className={`${isUrgent ? 'fill-orange-500' : ''}`} />
                    </button>
                  </div>
                  <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-2 text-center">
                    Press Enter to submit, Shift+Enter for new line
                  </div>
                </div>
              )}
            </div>
            {/* Task Counters */}
            <div className="mt-4 text-center text-light-text-muted dark:text-dark-text-muted text-sm">
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
            {showArchived ? (
              <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6">
                <div className="mb-4">
                  <p className="text-light-text-muted dark:text-dark-text-muted">
                    Archived - {archivedTasks.length} tasks
                  </p>
                </div>
                {archivedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-light-text-muted dark:text-dark-text-muted mb-4">
                      <Archive size={48} className="mx-auto" />
                    </div>
                    <p className="text-light-text-muted dark:text-dark-text-muted">No archived tasks yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {[...archivedTasks]
                      .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
                      .map((task) => {
                        const isNsfw = checkIsNsfw(task.text, nsfwTagList);
                        const isRevealed = revealedNsfw[task.id];

                        return (
                          <li
                            key={task.id}
                            className="flex items-start justify-between p-4 rounded-xl shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark"
                          >
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                                <button
                                  onClick={() => restoreTask(task)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 mt-1 flex-shrink-0 ${task.completed
                                    ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary'
                                    : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                                >
                                  {task.completed && <Check size={16} />}
                                </button>
                              </div>
                              <div className="flex-1">
                                {isNsfw && !isRevealed ? (
                                  <div className="flex items-center gap-2 p-2 rounded-lg">
                                    <span className="text-light-text-muted dark:text-dark-text-muted">Content hidden (NSFW tag)</span>
                                    <button
                                      onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: true }))}
                                      className="px-2 py-1 rounded text-sm flex items-center gap-1 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                                    >
                                      <Eye size={14} /> Show
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    {isNsfw && isRevealed && (
                                      <button
                                        onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: false }))}
                                        className="absolute -top-2 -right-2 p-1 rounded-full shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                                        title="Hide content"
                                      >
                                        <EyeOff size={14} />
                                      </button>
                                    )}
                                    <span className="text-light-text-muted dark:text-dark-text-muted line-through whitespace-pre-wrap break-words">
                                      {renderTextWithLinks(task.text)}
                                    </span>
                                    <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                                      Archived: {formatDate(task.archivedAt)}
                                    </div>
                                    {task.dueDate && <div className="text-xs text-light-text-muted dark:text-dark-text-muted">Due: {formatDate(task.dueDate)}</div>}
                                    {task.createdAt && <div className="text-xs text-light-text-muted dark:text-dark-text-muted">Created: {formatDate(task.createdAt)}</div>}
                                    {task.pinned === 'global' && <div className="text-xs text-light-text-muted dark:text-dark-text-muted">Global pinned</div>}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 ml-2">
                              <button
                                onClick={() => deleteArchivedTask(task.id)}
                                className="text-light-text-muted dark:text-dark-text-muted hover:text-light-danger dark:hover:text-dark-danger transition-colors mt-1"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6">
                <div className="mb-4">
                  <p className="text-light-text-muted dark:text-dark-text-muted">
                    {getTaskListHeaderText()} - {activeTasks.length} tasks
                  </p>
                </div>
                {sortedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-light-text-muted dark:text-dark-text-muted mb-4">
                      <Check size={48} className="mx-auto" />
                    </div>
                    <p className="text-light-text-muted dark:text-dark-text-muted">
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
                          className={`flex items-start justify-between p-4 rounded-xl transition-all duration-200 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark ${task.pinned !== 'none' ? 'bg-light-primary/5 dark:bg-dark-primary/5' : ''}`}
                        >
                          <div className="flex items-start space-x-3 flex-1">
                            <button
                              onClick={() => toggleComplete(task.id)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 mt-1 flex-shrink-0 ${task.completed ?
                                'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark bg-light-primary text-light-primary-text' :
                                'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
                            >
                              {task.completed && <Check size={16} />}
                            </button>
                            <div className="flex-1">
                              {editingTask === task.id ? (
                                <div className="w-full">
                                  <textarea // TODO: This is the edit input, not the main one.
                                    ref={editInputRef}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={handleEditKeyPress}
                                    className="w-full px-3 py-2 rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none resize-none"
                                    rows="3"
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={saveEditedTask}
                                      className="px-3 py-1 rounded-xl font-semibold text-light-primary dark:text-dark-primary shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingTask(null)}
                                      className="px-3 py-1 rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                isNsfw && !isRevealed ? (
                                  <div className="flex items-center gap-2 p-2 rounded-lg">
                                    <span className="text-light-text-muted dark:text-dark-text-muted">Content hidden (NSFW tag)</span>
                                    <button
                                      onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: true }))}
                                      className="px-2 py-1 rounded text-sm flex items-center gap-1 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                                    >
                                      <Eye size={14} /> Show
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative" onDoubleClick={() => handleDoubleClick(task)}>
                                    {isNsfw && isRevealed && (
                                      <button
                                        onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: false }))}
                                        className="absolute -top-2 -right-2 p-1 rounded-full shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                                        title="Hide content"
                                      >
                                        <EyeOff size={14} />
                                      </button>
                                    )}
                                    <span
                                      className={`${task.completed ?
                                        'text-light-text-muted dark:text-dark-text-muted line-through' :
                                        ''
                                        } whitespace-pre-wrap break-words`}
                                    >
                                      {renderTextWithLinks(task.text)}
                                    </span>
                                    {(task.pinned === 'none' || task.pinned === 'local') && task.dueDate && (
                                      <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                                        Due: {formatDate(task.dueDate)}
                                      </div>
                                    )}
                                    {task.pinned === 'global' && task.createdAt && (
                                      <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                                        Created: {formatDate(task.createdAt)}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2 self-center">
                            <button
                              onClick={() => toggleImportance(task.id)}
                              className={`p-1 rounded-full transition-colors ${task.importance ? 'text-amber-500' : 'text-light-text-muted dark:text-dark-text-muted'}`}
                              title={task.importance ? 'Mark as Not Important' : 'Mark as Important'}
                            >
                              <Star size={16} className={`${task.importance ? 'fill-amber-400' : 'fill-none'}`} />
                            </button>
                            <button
                              onClick={() => toggleUrgency(task.id)}
                              className={`p-1 rounded-full transition-colors ${task.urgency ? 'text-orange-500' : 'text-light-text-muted dark:text-dark-text-muted'}`}
                              title={task.urgency ? 'Mark as Not Urgent' : 'Mark as Urgent'}
                            >
                              <Flame size={16} className={`${task.urgency ? 'fill-orange-500' : 'fill-none'}`} />
                            </button>
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
                                {task.pinned === 'global' && <Shield size={16} />}
                                {task.pinned === 'local' && <Pin size={16} />}
                                {task.pinned === 'none' && <PinOff size={16} className="text-light-text-muted dark:text-dark-text-muted" />}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              // Eisenhower Matrix View
              <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6">
                <div className="mb-4">

                  <p className="text-light-text-muted dark:text-dark-text-muted">
                    {getTaskListHeaderText()} - {activeTasks.length} tasks
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[70vh]">
                  {[
                    { title: 'Do', description: 'Urgent & Important', tasks: matrixTasks.doTasks, style: 'border-red-500/50' },
                    { title: 'Schedule', description: 'Important & Not Urgent', tasks: matrixTasks.scheduleTasks, style: 'border-green-500/50' },
                    { title: 'Delegate', description: 'Urgent & Not Important', tasks: matrixTasks.delegateTasks, style: 'border-blue-500/50' },
                    { title: 'Eliminate', description: 'Not Urgent & Not Important', tasks: matrixTasks.eliminateTasks, style: 'border-gray-500/50' },
                  ].map(({ title, description, tasks, style }) => (
                    <div
                      key={title}
                      className={`rounded-xl p-4 flex flex-col min-h-[50vh] md:min-h-0 md:h-full shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark border-t-4 ${style}`}
                    >
                      <h4 className="font-bold text-lg">{title}</h4>
                      <p className="text-sm text-light-text-muted dark:text-dark-text-muted mb-4 flex-shrink-0">{description}</p>
                      <div className="overflow-y-auto h-full -mr-2">
                        <ul className="space-y-3 pr-2">
                          {tasks.length > 0 ? (
                            tasks.map(task => {
                              const isNsfw = checkIsNsfw(task.text, nsfwTagList);
                              const isRevealed = revealedNsfw[task.id];

                              return (
                                <li key={task.id} className="flex items-start justify-between p-3 rounded-xl shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark">
                                  <div className="flex items-start space-x-3 flex-1">
                                    <button onClick={() => toggleComplete(task.id)} className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 mt-1 flex-shrink-0 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark" />
                                    <div className="flex-1">
                                      {editingTask === task.id ? (
                                        <div className="w-full">
                                          <textarea // TODO: This is the edit input, not the main one.
                                            ref={editInputRef}
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={handleEditKeyPress}
                                            className="w-full px-3 py-2 rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none resize-none"
                                            rows="3"
                                          />
                                          <div className="flex gap-2 mt-2">
                                            <button
                                              onClick={saveEditedTask}
                                              className="px-3 py-1 rounded-xl font-semibold text-light-primary dark:text-dark-primary shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => setEditingTask(null)}
                                              className="px-3 py-1 rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        isNsfw && !isRevealed ? (
                                          <div className="flex items-center gap-2 p-2 rounded-lg">
                                            <span className="text-light-text-muted dark:text-dark-text-muted">Content hidden (NSFW tag)</span>
                                            <button
                                              onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: true }))}
                                              className="px-2 py-1 rounded text-sm flex items-center gap-1 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                                            >
                                              <Eye size={14} /> Show
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="relative" onDoubleClick={() => handleDoubleClick(task)}>
                                            {isNsfw && isRevealed && (
                                              <button
                                                onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: false }))}
                                                className="absolute -top-2 -right-2 p-1 rounded-full shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                                                title="Hide content"
                                              >
                                                <EyeOff size={14} />
                                              </button>
                                            )}
                                            <span
                                              className={`${task.completed ?
                                                'text-light-text-muted dark:text-dark-text-muted line-through' :
                                                ''
                                                } whitespace-pre-wrap break-words`}
                                            >
                                              {renderTextWithLinks(task.text)}
                                            </span>
                                            {(task.pinned === 'none' || task.pinned === 'local') && task.dueDate && (
                                              <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                                                Due: {formatDate(task.dueDate)}
                                              </div>
                                            )}
                                            {task.pinned === 'global' && task.createdAt && (
                                              <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                                                Created: {formatDate(task.createdAt)}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 ml-2 self-center">
                                    <button onClick={() => toggleImportance(task.id)} className={`p-1 rounded-full transition-colors ${task.importance ? 'text-amber-500' : 'text-light-text-muted dark:text-dark-text-muted'}`} title={task.importance ? 'Mark as Not Important' : 'Mark as Important'}>
                                      <Star size={14} className={`${task.importance ? 'fill-amber-400' : 'fill-none'}`} />
                                    </button>
                                    <button onClick={() => toggleUrgency(task.id)} className={`p-1 rounded-full transition-colors ${task.urgency ? 'text-orange-500' : 'text-light-text-muted dark:text-dark-text-muted'}`} title={task.urgency ? 'Mark as Not Urgent' : 'Mark as Urgent'}>
                                      <Flame size={14} className={`${task.urgency ? 'fill-orange-500' : 'fill-none'}`} />
                                    </button>
                                    <div className="relative w-5 h-5 flex items-center justify-center">
                                      <select value={task.pinned} onChange={(e) => updatePinMode(task.id, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title={`Change pin mode (current: ${task.pinned})`}>
                                        <option value="none">None</option>
                                        <option value="global">Global</option>
                                        <option value="local">Local</option>
                                      </select>
                                      <div className="pointer-events-none">
                                        {task.pinned === 'global' && <Shield size={14} />}
                                        {task.pinned === 'local' && <Pin size={14} />}
                                        {task.pinned === 'none' && <PinOff size={14} className="text-light-text-muted dark:text-dark-text-muted" />}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              )
                            })
                          ) : (
                            <p className="text-sm text-light-text-muted dark:text-dark-text-muted italic p-4 text-center">No tasks here.</p>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Locale Setting */}
                <div>
                  <label className="block font-medium mb-2">
                    Language & Region
                  </label>
                  <div className="relative">
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none appearance-none pr-10"
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
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-light-text-muted dark:text-dark-text-muted" />
                  </div>
                </div>

                {/* NSFW Tags Setting */}
                <div>
                  <label className="block font-medium mb-2">
                    NSFW Tags
                  </label>
                  <textarea
                    value={nsfwTags}
                    onChange={(e) => setNsfwTags(e.target.value)}
                    placeholder="Enter comma-separated tags to hide, e.g., work,secret"
                    className="w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none resize-y"
                    rows="3"
                  />
                  <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                    Tasks containing these tags will be hidden by default.
                  </p>
                </div>

                {/* Theme Setting */}
                <div>
                  <label className="block font-medium mb-2">
                    Theme Color
                  </label>
                  <div className="grid grid-cols-3 gap-3 p-1 rounded-xl shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor },
                    ].map(({ id, label, icon: Icon }) => (
                      <button key={id} onClick={() => setTheme(id)}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-150 ${theme === id ? 'text-light-primary dark:text-dark-primary shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark' : 'text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'}`}
                      >
                        <Icon size={20} />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Week Start Setting */}
                <div>
                  <label className="block font-medium mb-2">
                    First Day of Week
                  </label>
                  <div className="relative">
                    <select
                      value={weekStart}
                      onChange={(e) => setWeekStart(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none appearance-none pr-10"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-light-text-muted dark:text-dark-text-muted" />
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t pt-6 mt-6 border-light-danger/50 dark:border-dark-danger/50">
                  <label className="block text-light-danger dark:text-dark-danger font-medium mb-2">
                    Danger Zone
                  </label>
                  <button
                    onClick={handleClearDatabase}
                    className="w-full px-4 py-3 rounded-xl text-light-danger dark:text-dark-danger shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                  >
                    Clear All Data
                  </button>
                  <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                    This will permanently delete all your tasks, archives, and settings. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={saveSettings}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-light-primary dark:text-dark-primary shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-3 rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PomodoroTimer = ({ pomodoro, onReset, blockTitle }) => {
  const { timeLeft, duration, isActive, mode, queue, currentSliceIndex } = pomodoro;


  if (!isActive) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const isWork = mode === 'work';
  const title = isWork ? 'Focus Session' : 'Break Time';
  const progressColor = isWork ? 'bg-light-primary' : 'bg-green-500';

  return (
    <div className="mt-4 p-4 rounded-xl shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
      <h4 className="text-sm font-semibold text-light-text-muted dark:text-dark-text-muted mb-2 flex items-center gap-2">
        {isWork ? <Flame size={16} /> : <Coffee size={16} />}
        {title}
        {queue.length > 0 && <span className="text-xs font-mono">({currentSliceIndex + 1}/{queue.length})</span>}
      </h4>
      <p className="text-xs text-light-text-muted dark:text-dark-text-muted mb-3 truncate" title={blockTitle}>On: {blockTitle}</p>
      <div className="text-center font-mono text-5xl font-bold my-4">
        {minutes}:{seconds}
      </div>
      <div className="w-full bg-light-text/10 dark:bg-dark-text/10 rounded-full h-2 mb-4 shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark">
        <div className={`h-2 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={onReset} className="p-3 rounded-full shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark" title="Stop">
          <Square size={20} />
        </button>
      </div>
    </div>
  );
};

// --- Planner Layout Helpers ---
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const doBlocksOverlap = (blockA, blockB) => {
  return timeToMinutes(blockA.startTime) < timeToMinutes(blockB.endTime) && timeToMinutes(blockA.endTime) > timeToMinutes(blockB.startTime);
};

const getLayoutForPlannerBlocks = (blocks) => {
  const timedBlocks = blocks.map(b => ({
    ...b,
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  const visited = new Set();
  const collisionGroups = [];
  for (const block of timedBlocks) {
    if (visited.has(block.id)) continue;
    const group = [];
    const queue = [block];
    visited.add(block.id);
    while (queue.length > 0) {
      const current = queue.shift();
      group.push(current);
      for (const other of timedBlocks) {
        if (!visited.has(other.id) && doBlocksOverlap(current, other)) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }
    collisionGroups.push(group);
  }

  const laidOutBlocks = [];
  for (const group of collisionGroups) {
    group.sort((a, b) => a.start - b.start || b.end - a.end);
    const columns = [];
    for (const block of group) {
      let placed = false;
      for (const col of columns) {
        if (col[col.length - 1].end <= block.start) {
          col.push(block);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([block]);
    }
    const numCols = columns.length;
    columns.forEach((col, colIndex) => {
      for (const block of col) {
        laidOutBlocks.push({ ...block, layout: { width: 100 / numCols, left: (100 / numCols) * colIndex, col: colIndex } });
      }
    });
  }
  return laidOutBlocks;
};

const DayPlannerView = ({ plannerBlocks, setPlannerBlocks, workSettings, setWorkSettings, currentTime, locale, savePlannerBlockToDB, deletePlannerBlockFromDB, setViewMode, pomodoro, startPomodoro, handleResetPomodoro }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [newBlockData, setNewBlockData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    color: 'bg-blue-500'
  });
  const [editingBlock, setEditingBlock] = useState(null);
  const [modalSettings, setModalSettings] = useState(workSettings);

  useEffect(() => {
    setModalSettings(workSettings);
  }, [workSettings]);

  const laidOutBlocks = React.useMemo(() => getLayoutForPlannerBlocks(plannerBlocks), [plannerBlocks]);

  const colors = [
    'border-blue-500', 'border-green-500', 'border-purple-500', 'border-pink-500',
    'border-indigo-500', 'border-teal-500', 'border-orange-500', 'border-red-500'
  ];

  const isCurrentBlock = (startTime, endTime) => {
    const now = new Date(); // Use real time for "Now" indicator
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startBlock = new Date(now);
    startBlock.setHours(startHours, startMinutes, 0, 0);

    const endBlock = new Date(now);
    endBlock.setHours(endHours, endMinutes, 0, 0);

    return now >= startBlock && now < endBlock;
  };

  const generateTimeSlots = () => {
    const slots = [];
    const [startHour] = workSettings.startTime.split(':').map(Number);
    const [endHour] = workSettings.endTime.split(':').map(Number);

    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeToPosition = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = parseInt(workSettings.startTime.split(':')[0]) * 60 + parseInt(workSettings.startTime.split(':')[1]);
    return ((totalMinutes - startMinutes) / 30) * 40; // 40px per 30 minutes
  };

  const blockHeight = (startTime, endTime) => {
    const start = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const end = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    return ((end - start) / 30) * 40;
  };

  const addPlannerBlock = () => {
    if (newBlockData.title && newBlockData.startTime && newBlockData.endTime) {
      const block = { id: Date.now(), ...newBlockData };
      const newBlocks = [...plannerBlocks, block];
      setPlannerBlocks(newBlocks);
      savePlannerBlockToDB(block);
      setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' });
      setShowAddBlockModal(false);
    }
  };

  const deletePlannerBlock = (id) => {
    setPlannerBlocks(plannerBlocks.filter(block => block.id !== id));
    deletePlannerBlockFromDB(id);
  };

  const startEditBlock = (block) => {
    setEditingBlock(block);
    setNewBlockData({ title: block.title, startTime: block.startTime, endTime: block.endTime, color: block.color });
    setShowAddBlockModal(true);
  };

  const saveEditBlock = () => {
    if (editingBlock && newBlockData.title && newBlockData.startTime && newBlockData.endTime) {
      const updatedBlocks = plannerBlocks.map(block =>
        block.id === editingBlock.id ? { ...block, ...newBlockData } : block
      );
      setPlannerBlocks(updatedBlocks);
      savePlannerBlockToDB({ ...editingBlock, ...newBlockData });
      setEditingBlock(null);
      setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' });
      setShowAddBlockModal(false);
    }
  };

  const handleSaveSettings = () => {
    setWorkSettings(modalSettings);
    setShowSettingsModal(false);
  };

  // Close settings on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowSettingsModal(false);
        setShowAddBlockModal(false);
        setEditingBlock(null);
        setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' });
      }
    };

    if (showSettingsModal || showAddBlockModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSettingsModal, showAddBlockModal]);

  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu */}
          <div className="lg:w-1/3">
            <div className="sticky top-8 bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6 flex flex-col">
              <button
                onClick={() => setViewMode('list')} className="mb-4 flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <button onClick={() => { setEditingBlock(null); setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' }); setShowAddBlockModal(true); }} className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark">
                    <Plus className="w-5 h-5" />
                    <span>New block</span>
                  </button>
                </div>
                {/* Settings Button */}
                <button
                  onClick={() => { setModalSettings(workSettings); setShowSettingsModal(true); }}
                  className="p-4 rounded-lg transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"
                >
                  <Settings size={20} />
                </button>
              </div>
              <div>
                <PomodoroTimer
                  pomodoro={pomodoro}
                  onReset={handleResetPomodoro}
                  blockTitle={pomodoro.blockId ? plannerBlocks.find(b => b.id === pomodoro.blockId)?.title : ''}
                />
              </div>
            </div>
          </div>
          {/* Day calendar */}
          <div className="lg:w-2/3">
            <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark overflow-hidden">
              <div className="flex">
                <div className="w-20 border-r border-light-text/10 dark:border-dark-text/10">
                  <div className="h-16 border-b border-light-text/10 dark:border-dark-text/10 flex items-center justify-center text-sm font-medium text-light-text-muted dark:text-dark-text-muted">Time</div>
                  {timeSlots.map((time, index) => (
                    <div key={time} className={`h-10 border-b border-light-text/10 dark:border-dark-text/10 flex items-center justify-center text-xs ${index % 2 === 0 ? 'bg-light-bg/50 dark:bg-dark-bg/50' : ''}`}>{time}</div>
                  ))}
                </div>

                <div className="flex-1 relative">
                  <div className="h-16 border-b border-light-text/10 dark:border-dark-text/10 flex items-center justify-center">
                    <h2 className="text-lg font-semibold">{currentTime.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                  </div>
                  <div className="relative px-1">
                    {timeSlots.map((time, index) => (
                      <div key={time} className={`h-10 border-b border-light-text/10 dark:border-dark-text/10 ${index % 2 === 0 ? 'bg-light-bg/50 dark:bg-dark-bg/50' : ''}`} />
                    ))}
                    {laidOutBlocks.map((block) => (
                      <div key={block.id} className={`absolute bg-light-surface dark:bg-dark-surface border-l-4 ${block.color} rounded-lg p-3 text-light-text dark:text-dark-text shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark transition-all duration-200 cursor-pointer ${isCurrentBlock(block.startTime, block.endTime) ? 'ring-2 ring-light-primary dark:ring-dark-primary' : ''}`} style={{ top: `${timeToPosition(block.startTime)}px`, height: `${blockHeight(block.startTime, block.endTime)}px`, left: `${block.layout.left}%`, width: `calc(${block.layout.width}% - 2px)`, minHeight: '40px' }}>
                        <div className="flex justify-between items-start h-full w-full">
                          <div className="flex-1 overflow-hidden">
                            <h3 className="font-semibold truncate" title={block.title}>{block.title}</h3>
                            <p className="text-xs opacity-90">{block.startTime} - {block.endTime}</p>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                            {isCurrentBlock(block.startTime, block.endTime) && !pomodoro.isActive && (
                              <button onClick={(e) => { e.stopPropagation(); startPomodoro(block.id); }} className="p-1.5 rounded-full text-light-primary dark:text-dark-primary hover:bg-light-primary/10 dark:hover:bg-dark-primary/10 transition-colors" title="Start Focus Session">
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); startEditBlock(block); }} className="p-1.5 rounded-full text-light-text-muted dark:text-dark-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Edit Block"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deletePlannerBlock(block.id); }} className="p-1.5 rounded-full text-light-text-muted dark:text-dark-text-muted hover:text-light-danger dark:hover:text-dark-danger hover:bg-red-500/10 transition-colors" title="Delete Block"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {isCurrentBlock(block.startTime, block.endTime) && (
                          <div className="absolute -top-2 -right-2 bg-light-primary text-light-primary-text text-xs font-bold px-2 py-1 rounded-full animate-pulse">Now</div>
                        )}
                      </div>
                    ))}
                    <div className="absolute left-0 right-0 h-0.5 bg-light-primary z-10" style={{ top: `${timeToPosition(`${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`)}px` }}>
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-light-primary rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        showAddBlockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingBlock ? 'Edit Block' : 'Add New Block'}</h2>
                <button onClick={() => { setShowAddBlockModal(false); setEditingBlock(null); setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' }); }} className="p-2 rounded-full transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">Block Title</label>
                  <input type="text" placeholder="Enter title" value={newBlockData.title} onChange={(e) => setNewBlockData({ ...newBlockData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">Start Time</label>
                    <input type="time" value={newBlockData.startTime} onChange={(e) => setNewBlockData({ ...newBlockData, startTime: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">End Time</label>
                    <input type="time" value={newBlockData.endTime} onChange={(e) => setNewBlockData({ ...newBlockData, endTime: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">Color</label>
                  <select value={newBlockData.color} onChange={(e) => setNewBlockData({ ...newBlockData, color: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none appearance-none">
                    {colors.map(color => (<option key={color} value={color}>{color.split('-')[1].charAt(0).toUpperCase() + color.split('-')[1].slice(1)}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={editingBlock ? saveEditBlock : addPlannerBlock} className="flex-1 font-semibold text-light-primary dark:text-dark-primary py-2 px-4 rounded-lg transition-all shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark">{editingBlock ? 'Save' : 'Add'}</button>
                <button onClick={() => { setShowAddBlockModal(false); setEditingBlock(null); setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' }); }} className="flex-1 py-2 px-4 rounded-lg transition-all shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark">Cancel</button>
              </div>
            </div>
          </div>
        )
      }

      {
        showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Work Time Settings</h2>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 rounded-full transition-all duration-150 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">Work Day Start</label>
                  <input type="time" value={modalSettings.startTime} onChange={(e) => setModalSettings({ ...modalSettings, startTime: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">Work Day End</label>
                  <input type="time" value={modalSettings.endTime} onChange={(e) => setModalSettings({ ...modalSettings, endTime: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-light-text/10 dark:border-dark-text/10">
                  <div>
                    <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">Work Session (min)</label>
                    <input type="number" min="1" value={modalSettings.pomodoroWorkDuration} onChange={(e) => setModalSettings({ ...modalSettings, pomodoroWorkDuration: parseInt(e.target.value, 10) || 0 })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-text-muted dark:text-dark-text-muted mb-2">Break (min)</label>
                    <input type="number" min="1" value={modalSettings.pomodoroBreakDuration} onChange={(e) => setModalSettings({ ...modalSettings, pomodoroBreakDuration: parseInt(e.target.value, 10) || 0 })} className="w-full px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={handleSaveSettings} className="flex-1 font-semibold text-light-primary dark:text-dark-primary py-2 px-4 rounded-lg transition-all shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark">Save</button>
                <button onClick={() => setShowSettingsModal(false)} className="flex-1 py-2 px-4 rounded-lg transition-all shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark">Cancel</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App
