import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Check, Pin, PinOff, Archive, List, Send, Shield, Settings, X, Eye, EyeOff, LoaderCircle, Star, Grid, Flame, Clock, Edit3, ChevronLeft, Play, Pause, RotateCcw, Coffee } from 'lucide-react';

// --- Material 3-inspired Color System ---

const hexToHSL = (hex) => {
  if (!hex || !hex.startsWith('#')) return { h: 0, s: 0, l: 0 };
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) { // #rgb
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) { // #rrggbb
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

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

const generateTonalPalette = (h, s) => {
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  const palette = {};
  for (const tone of tones) {
    palette[tone] = hslToCss(h, s, tone);
  }
  return palette;
};

const generateM3Scheme = (sourceHex) => {
  const primaryHSL = hexToHSL(sourceHex);
  const secondaryHSL = { h: (primaryHSL.h + 60) % 360, s: Math.max(10, primaryHSL.s * 0.35), l: primaryHSL.l };
  const tertiaryHSL = { h: (primaryHSL.h - 60 + 360) % 360, s: Math.max(20, primaryHSL.s * 0.75), l: primaryHSL.l };
  const neutralHSL = { h: primaryHSL.h, s: Math.max(2, primaryHSL.s * 0.1), l: primaryHSL.l };
  const neutralVariantHSL = { h: primaryHSL.h, s: Math.max(5, primaryHSL.s * 0.2), l: primaryHSL.l };
  const errorHSL = { h: 25, s: 84, l: 50 };

  const pPalette = generateTonalPalette(primaryHSL.h, primaryHSL.s);
  const sPalette = generateTonalPalette(secondaryHSL.h, secondaryHSL.s);
  const tPalette = generateTonalPalette(tertiaryHSL.h, tertiaryHSL.s);
  const nPalette = generateTonalPalette(neutralHSL.h, neutralHSL.s);
  const nvPalette = generateTonalPalette(neutralVariantHSL.h, neutralVariantHSL.s);
  const ePalette = generateTonalPalette(errorHSL.h, errorHSL.s);

  // Light theme color roles from Material Design 3
  return {
    primary: pPalette[40],
    onPrimary: pPalette[100],
    primaryContainer: pPalette[90],
    onPrimaryContainer: pPalette[10],
    secondary: sPalette[40],
    onSecondary: sPalette[100],
    secondaryContainer: sPalette[90],
    onSecondaryContainer: sPalette[10],
    tertiary: tPalette[40],
    onTertiary: tPalette[100],
    tertiaryContainer: tPalette[90],
    onTertiaryContainer: tPalette[10],
    error: ePalette[40],
    onError: ePalette[100],
    errorContainer: ePalette[90],
    onErrorContainer: ePalette[10],
    background: nPalette[99],
    onBackground: nPalette[10],
    surface: nPalette[99],
    onSurface: nPalette[10],
    surfaceVariant: nvPalette[90],
    onSurfaceVariant: nvPalette[30],
    outline: nvPalette[50],
    outlineVariant: nvPalette[80],
  };
};

const MiniPomodoroTimer = ({ pomodoro }) => {
  const { timeLeft, duration, mode } = pomodoro;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const isWork = mode === 'work';

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
      <div className="flex justify-between items-center text-xs mb-1.5 text-[var(--color-text-secondary)]">
        <span className="font-semibold flex items-center gap-1.5">
          {isWork ? (
            <Flame size={14} className="text-orange-500 animate-pulse" />
          ) : (
            <Coffee size={14} className="text-cyan-500" />
          )}
          <span>{isWork ? 'Focus Session' : 'On a Break'}</span>
        </span>
        <span className="font-mono font-bold text-base text-[var(--color-text-primary)]">{minutes}:{seconds}</span>
      </div>
      <div className="w-full bg-[var(--color-border)] rounded-full h-2">
        <div className={`${isWork ? 'bg-[var(--color-button-primary)]' : 'bg-cyan-500'} h-2 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
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
  const [locale, setLocale] = useState('en-US');
  const [theme, setTheme] = useState('purple');
  const [weekStart, setWeekStart] = useState(0); // 0 = Sunday, 1 = Monday
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const [customColor, setCustomColor] = useState('#8b5cf6');
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

  const handlePauseResumePomodoro = () => {
    setPomodoro(p => ({ ...p, isPaused: !p.isPaused }));
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

  const generatePaletteFromHex = React.useCallback((baseHex) => {
    const scheme = generateM3Scheme(baseHex);
    const { h, s, l } = hexToHSL(scheme.primary);

    return {
      primary: scheme.primary,
      gradientFrom: scheme.secondaryContainer,
      gradientTo: scheme.tertiaryContainer,
      bgPrimary: scheme.surface,
      bgSecondary: scheme.secondaryContainer,
      textPrimary: scheme.onSurface,
      textSecondary: scheme.onSecondaryContainer,
      textMuted: hslToCss(hexToHSL(scheme.onSurface).h, hexToHSL(scheme.onSurface).s, 55),
      textLight: hslToCss(hexToHSL(scheme.onSurface).h, hexToHSL(scheme.onSurface).s, 70),
      border: scheme.outlineVariant,
      focus: scheme.primary,
      buttonPrimary: scheme.primary,
      buttonPrimaryHover: hslToCss(hexToHSL(scheme.primary).h, hexToHSL(scheme.primary).s, hexToHSL(scheme.primary).l - 5), // Keep some interaction flair
      buttonSecondary: scheme.secondaryContainer,
      buttonSecondaryHover: scheme.primaryContainer,
      ring: hslToCss(h, s, l + 20, 0.5),
      calendarToday: scheme.primaryContainer,
      calendarSelected: scheme.primary,
      calendarHover: scheme.primaryContainer,
      textOnPrimary: scheme.onPrimary,
      link: scheme.primary,
      linkHover: scheme.tertiary,
      switchInactive: scheme.outline,
      switchThumb: scheme.surface,
      borderUncompletedTask: scheme.outlineVariant,
      checkboxBorder: scheme.outline,
      checkboxBorderHover: scheme.primary,
      checkboxBorderCompleted: scheme.primary,
      selectHover: scheme.secondary,
      themeSelectBorderActive: scheme.primary,
      themeSelectRingActive: hslToCss(h, s, l + 20, 0.5),
      themeSelectRingHover: scheme.primaryContainer,
      buttonDanger: scheme.error,
      buttonDangerHover: hslToCss(hexToHSL(scheme.error).h, hexToHSL(scheme.error).s, hexToHSL(scheme.error).l - 5),
      textDanger: scheme.error,
      borderDanger: scheme.errorContainer,

      // Matrix quadrant backgrounds
      matrixDoBg: scheme.errorContainer,
      matrixScheduleBg: scheme.tertiaryContainer,
      matrixDelegateBg: scheme.outlineVariant,
      matrixEliminateBg: scheme.surfaceVariant,
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
              settingsStore.put({ id: 'locale', value: 'en-US' });
              settingsStore.put({ id: 'theme', value: 'purple' });
              settingsStore.put({ id: 'weekStart', value: 0 }); // Sunday by default
              settingsStore.put({ id: 'hideGlobal', value: false });
              settingsStore.put({ id: 'hideLocal', value: false }); settingsStore.put({ id: 'customColor', value: '#8b5cf6' });
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
      const editInputRef = useRef(null);
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

  const handleCalendarHeaderClick = () => {
    if (calendarViewMode === 'days') {
      setCalendarViewMode('months');
    } else if (calendarViewMode === 'months') {
      setCalendarViewMode('years');
    }
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
      handlePauseResumePomodoro={handlePauseResumePomodoro}
      handleResetPomodoro={handleResetPomodoro}
    />;
  }

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
            <div className="sticky top-4 bg-[var(--color-bg-primary)] rounded-2xl shadow-lg p-6 flex flex-col">
              {/* Mini Planner View */}
              <div
                onClick={() => setViewMode('planner')}
                className="mb-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-button-secondary-hover)] transition-colors"
              >
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-2">
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
                        <div key={block.id}>
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-semibold text-[var(--color-text-primary)] truncate pr-2" title={block.title}>{block.title}</span>
                            <span className="text-[var(--color-text-muted)] flex-shrink-0">{block.startTime} - {block.endTime}</span>
                          </div>
                          <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                            <div className={`${block.color} h-2 rounded-full`} style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-[var(--color-text-muted)] py-2 text-sm">
                    <p>No active block. Time to plan!</p>
                  </div>
                )}
                {pomodoro.isActive && <MiniPomodoroTimer pomodoro={pomodoro} />}
              </div>

              {/* Global Pomodoro Timer is now inside the planner preview */}
              <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
                    disabled={showArchived}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-colors bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)] disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={viewMode === 'list' ? 'Switch to Matrix View' : 'Switch to List View'}
                  >
                    {viewMode === 'list' ? <Grid size={20} /> : <List size={20} />}
                    <span className="hidden sm:inline">{viewMode === 'list' ? 'Matrix' : 'List'}</span>
                  </button>
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-colors ${showArchived ?
                      'bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-button-primary-hover)]' :
                      'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}
                  >
                    <Archive size={20} />
                    <span className="hidden sm:inline">Archive</span>
                  </button>
                </div>

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
                {/* Time Range Filter */}
                {!showArchived && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg">
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
                            if (filter.id === 'day') setCalendarViewMode('days');
                            else if (filter.id === 'month' || filter.id === 'quarter') setCalendarViewMode('months');
                            else if (filter.id === 'year') setCalendarViewMode('years');
                            else setCalendarViewMode('days'); // Default for 'All Time'
                          }}
                          className={`px-2 py-1 text-sm rounded-md transition-colors flex-1 text-center ${timeFilterMode === filter.id
                            ? 'bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)] shadow'
                            : 'hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)]'
                            }`}
                        >{filter.label}</button>
                      ))}
                    </div>
                  </div>
                )}

                {calendarViewMode === 'days' && timeFilterMode != 'all' && (
                  <div className="flex justify-between items-center mb-4">
                    <h3>
                      {formatDate(currentDate, { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCalendarNav(-1)}
                        className="p-2 rounded-lg bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)]"
                        title="Previous"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={goToToday}
                        className="p-2 rounded-lg bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)] text-sm"
                        title="Go to Today"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => handleCalendarNav(1)}
                        className="p-2 rounded-lg bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)]"
                        title="Next"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {calendarViewMode === 'days' && getWeekdayNames().map((day, index) => (
                    <div key={index} className="text-center text-[var(--color-text-secondary)] text-sm font-medium py-1">
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
                          className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative ${isSelected
                            ? 'bg-[var(--color-calendar-selected)] text-[var(--color-text-on-primary)]'
                            : isToday ? 'bg-[var(--color-calendar-today)] border-2 border-[var(--color-calendar-selected)]' : 'hover:bg-[var(--color-calendar-hover)]'
                            } ${taskCount > 0 ? 'font-bold' : ''}`}
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
                )}

                {calendarViewMode === 'months' && (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(12).keys()].map(monthIndex => {
                      const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1);
                      const selectedYear = selectedDate.getFullYear();
                      const selectedMonth = selectedDate.getMonth();
                      const selectedQuarter = Math.floor(selectedMonth / 3);
                      const currentYear = monthDate.getFullYear();
                      const currentMonth = monthDate.getMonth();
                      const currentQuarter = Math.floor(currentMonth / 3);

                      let isSelected = false;
                      if (currentYear === selectedYear) {
                        if (timeFilterMode === 'month' && currentMonth === selectedMonth) isSelected = true;
                        if (timeFilterMode === 'quarter' && currentQuarter === selectedQuarter) isSelected = true;
                      }
                      return (
                        <button
                          key={monthIndex}
                          onClick={() => selectMonth(monthIndex)}
                          className={`py-4 rounded-lg text-center transition-colors ${isSelected
                            ? 'bg-[var(--color-calendar-selected)] text-[var(--color-text-on-primary)]'
                            : 'hover:bg-[var(--color-calendar-hover)]'
                            }`}
                        >
                          {formatDate(monthDate, { month: 'short' })}
                        </button>
                      );
                    })}
                  </div>
                )}

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
                          className={`py-4 rounded-lg text-center transition-colors ${isSelected
                            ? 'bg-[var(--color-calendar-selected)] text-[var(--color-text-on-primary)]'
                            : 'hover:bg-[var(--color-calendar-hover)]'
                            }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!showArchived && (
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
              )}

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
              {!showArchived && (
                <div className="mt-6">
                  <div className="relative">
                    {showTagSuggestions && tagSuggestions.length > 0 && (
                      <div ref={suggestionsRef} className="absolute bottom-full mb-2 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        <ul className="p-1">
                          {tagSuggestions.map((tag, index) => (
                            <li key={tag}>
                              <button
                                onClick={() => selectTagSuggestion(tag)}
                                onMouseOver={() => setHighlightedTagIndex(index)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                                  index === highlightedTagIndex
                                    ? 'bg-[var(--color-button-secondary-hover)] text-[var(--color-text-primary)]'
                                    : 'text-[var(--color-text-secondary)]'
                                  } hover:bg-[var(--color-button-secondary-hover)]`}
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
                    <div className="border-l h-6 border-[var(--color-border)] mx-2"></div>
                    <button onClick={() => setIsImportant(!isImportant)} title={`Mark as ${isImportant ? 'Not Important' : 'Important'}`} className={`p-2 rounded-full transition-colors ${isImportant ? 'bg-amber-400 text-white' : 'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}>
                      <Star size={16} className={`${isImportant ? 'fill-white' : ''}`} />
                    </button>
                    <button onClick={() => setIsUrgent(!isUrgent)} title={`Mark as ${isUrgent ? 'Not Urgent' : 'Urgent'}`} className={`p-2 rounded-full transition-colors ${isUrgent ? 'bg-orange-500 text-white' : 'bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]'}`}>
                      <Flame size={16} className={`${isUrgent ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                  <div className="text-xs text-[var(--color-text-light)] mt-2 text-center">
                    Press Enter to submit, Shift+Enter for new line
                  </div>
                </div>
              )}
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
            {showArchived ? (
              <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                  <p className="text-[var(--color-text-secondary)]">
                    Archived - {archivedTasks.length} tasks
                  </p>
                </div>
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
                      .map((task) => {
                        const isNsfw = checkIsNsfw(task.text, nsfwTagList);
                        const isRevealed = revealedNsfw[task.id];

                        return (
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
                                {isNsfw && !isRevealed ? (
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
                                  <div className="relative">
                                    {isNsfw && isRevealed && (
                                      <button
                                        onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: false }))}
                                        className="absolute -top-2 -right-2 p-1 rounded-full bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]"
                                        title="Hide content"
                                      >
                                        <EyeOff size={14} />
                                      </button>
                                    )}
                                    <span className="text-[var(--color-text-light)] line-through whitespace-pre-wrap break-words">
                                      {renderTextWithLinks(task.text)}
                                    </span>
                                    <div className="text-xs text-[var(--color-text-light)] mt-1">
                                      Archived: {formatDate(task.archivedAt)}
                                    </div>
                                    {task.dueDate && <div className="text-xs text-[var(--color-text-light)]">Due: {formatDate(task.dueDate)}</div>}
                                    {task.createdAt && <div className="text-xs text-[var(--color-text-light)]">Created: {formatDate(task.createdAt)}</div>}
                                    {task.pinned === 'global' && <div className="text-xs text-[var(--color-text-light)]">Global pinned</div>}
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
                        );
                      })}
                  </ul>
                )}
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                  <p className="text-[var(--color-text-secondary)]">
                    {getTaskListHeaderText()} - {activeTasks.length} tasks
                  </p>
                </div>
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
                                  <textarea // TODO: This is the edit input, not the main one.
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
                          <div className="flex items-center space-x-1 ml-2 self-center">
                            <button
                              onClick={() => toggleImportance(task.id)}
                              className="p-1 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)] transition-colors"
                              title={task.importance ? 'Mark as Not Important' : 'Mark as Important'}
                            >
                              <Star size={16} className={`${task.importance ? 'fill-amber-400 text-amber-500' : 'fill-none'}`} />
                            </button>
                            <button
                              onClick={() => toggleUrgency(task.id)}
                              className="p-1 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)] transition-colors"
                              title={task.urgency ? 'Mark as Not Urgent' : 'Mark as Urgent'}
                            >
                              <Flame size={16} className={`${task.urgency ? 'fill-orange-500 text-orange-600' : 'fill-none'}`} />
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
              </div>
            ) : (
              // Eisenhower Matrix View
              <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-lg p-6">
                <div className="mb-4">

                  <p className="text-[var(--color-text-secondary)]">
                    {getTaskListHeaderText()} - {activeTasks.length} tasks
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[70vh]">
                  {[
                    { title: 'Do', description: 'Urgent & Important', tasks: matrixTasks.doTasks, bgColorVar: 'var(--color-matrix-do-bg)' },
                    { title: 'Schedule', description: 'Important & Not Urgent', tasks: matrixTasks.scheduleTasks, bgColorVar: 'var(--color-matrix-schedule-bg)' },
                    { title: 'Delegate', description: 'Urgent & Not Important', tasks: matrixTasks.delegateTasks, bgColorVar: 'var(--color-matrix-delegate-bg)' },
                    { title: 'Eliminate', description: 'Not Urgent & Not Important', tasks: matrixTasks.eliminateTasks, bgColorVar: 'var(--color-matrix-eliminate-bg)' },
                  ].map(({ title, description, tasks, bgColorVar }) => (
                    <div
                      key={title}
                      className={`rounded-xl p-4 flex flex-col min-h-[50vh] md:min-h-0 md:h-full`}
                      style={{ backgroundColor: bgColorVar }}
                    >
                      <h4 className="font-bold text-lg text-[var(--color-text-primary)]">{title}</h4>
                      <p className="text-sm text-[var(--color-text-muted)] mb-4 flex-shrink-0">{description}</p>
                      <div className="overflow-y-auto h-full -mr-2">
                        <ul className="space-y-3 pr-2">
                          {tasks.length > 0 ? (
                            tasks.map(task => (
                              <li key={task.id} className="flex items-start justify-between p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                                <div className="flex items-start space-x-3 flex-1">
                                  <button onClick={() => toggleComplete(task.id)} className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-1 flex-shrink-0 border-[var(--color-checkbox-border)] hover:border-[var(--color-checkbox-border-hover)]" />
                                  <div className="flex-1 text-sm" onDoubleClick={() => handleDoubleClick(task)}>
                                    <span className="text-[var(--color-text-primary)] whitespace-pre-wrap break-words">{renderTextWithLinks(task.text)}</span>
                                    {task.dueDate && <div className="text-xs text-[var(--color-text-light)] mt-1">Due: {formatDate(task.dueDate)}</div>}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2 self-center">
                                  <button onClick={() => toggleImportance(task.id)} className="p-1 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)] transition-colors" title={task.importance ? 'Mark as Not Important' : 'Mark as Important'}>
                                    <Star size={14} className={`${task.importance ? 'fill-amber-400 text-amber-500' : 'fill-none'}`} />
                                  </button>
                                  <button onClick={() => toggleUrgency(task.id)} className="p-1 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)] transition-colors" title={task.urgency ? 'Mark as Not Urgent' : 'Mark as Urgent'}>
                                    <Flame size={14} className={`${task.urgency ? 'fill-orange-500 text-orange-600' : 'fill-none'}`} />
                                  </button>
                                  <div className="relative w-5 h-5 flex items-center justify-center">
                                    <select value={task.pinned} onChange={(e) => updatePinMode(task.id, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title={`Change pin mode (current: ${task.pinned})`}>
                                      <option value="none">None</option>
                                      <option value="global">Global</option>
                                      <option value="local">Local</option>
                                    </select>
                                    <div className="pointer-events-none">
                                      {task.pinned === 'global' && <Shield size={14} className="text-[var(--color-text-secondary)]" />}
                                      {task.pinned === 'local' && <Pin size={14} className="text-[var(--color-text-secondary)]" />}
                                      {task.pinned === 'none' && <PinOff size={14} className="text-[var(--color-text-light)]" />}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))
                          ) : (
                            <p className="text-sm text-[var(--color-text-muted)] italic p-4 text-center">No tasks here.</p>
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
                  onClick={saveSettings}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-button-primary-hover)]"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]"
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

const PomodoroTimer = ({ pomodoro, onPauseResume, onReset, blockTitle }) => {
  const { timeLeft, duration, isPaused, isActive, mode, queue, currentSliceIndex } = pomodoro;

  if (!isActive) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const isWork = mode === 'work';
  const title = isWork ? 'Focus Session' : 'Break Time';
  const progressColor = isWork ? 'var(--color-button-primary)' : 'var(--color-select-hover)';

  return (
    <div className="mt-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
      <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-2">
        {isWork ? <Flame size={16} /> : <Coffee size={16} />}
        {title}
        {queue.length > 0 && <span className="text-xs font-mono">({currentSliceIndex + 1}/{queue.length})</span>}
      </h4>
      <p className="text-xs text-[var(--color-text-muted)] mb-3 truncate" title={blockTitle}>On: {blockTitle}</p>
      <div className="text-center font-mono text-5xl font-bold text-[var(--color-text-primary)] my-4">
        {minutes}:{seconds}
      </div>
      <div className="w-full bg-[var(--color-border)] rounded-full h-2 mb-4">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: progressColor }}></div>
      </div>
      <div className="flex justify-center gap-4">
        <button onClick={onPauseResume} className="p-3 rounded-full bg-[var(--color-button-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-button-primary-hover)]" title={isPaused ? "Resume" : "Pause"}>
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        <button onClick={onReset} className="p-3 rounded-full bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)]" title="Reset">
          <RotateCcw size={20} />
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

const DayPlannerView = ({ plannerBlocks, setPlannerBlocks, workSettings, setWorkSettings, currentTime, locale, savePlannerBlockToDB, deletePlannerBlockFromDB, setViewMode, pomodoro, startPomodoro, handlePauseResumePomodoro, handleResetPomodoro }) => {
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
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500'
  ];

  const isCurrentBlock = (startTime, endTime) => {
    const now = currentTime;
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
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-gradient-from)] to-[var(--color-gradient-to)]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu */}
          <div className="lg:w-1/3">
            <div className="sticky top-4 bg-[var(--color-bg-primary)] rounded-2xl shadow-lg p-6 flex flex-col">
              <button
                onClick={() => setViewMode('list')} className="mb-4 flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-colors bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
              <div className="flex flex-row gap-4 mb-4">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <button onClick={() => { setEditingBlock(null); setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' }); setShowAddBlockModal(true); }} className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg transition-colors bg-[var(--color-button-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-button-secondary-hover)] disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <span>New block</span>
                  </button>
                </div>
                {/* Settings Button */}
                <button
                  onClick={() => { setModalSettings(workSettings); setShowSettingsModal(true); }}
                  className="p-4 rounded-lg bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)]"
                >
                  <Settings size={20} />
                </button>
              </div>
              <div>
                <PomodoroTimer
                  pomodoro={pomodoro}
                  onPauseResume={handlePauseResumePomodoro}
                  onReset={handleResetPomodoro}
                  blockTitle={pomodoro.blockId ? plannerBlocks.find(b => b.id === pomodoro.blockId)?.title : ''}
                />
              </div>
            </div>
          </div>
          {/* Day calendar */}
          <div className="lg:w-2/3">
            <div className="bg-[var(--color-bg-primary)] rounded-xl shadow-lg overflow-hidden">
              <div className="flex">
                <div className="w-20 border-r border-[var(--color-border)]">
                  <div className="h-16 border-b border-[var(--color-border)] flex items-center justify-center text-sm font-medium text-[var(--color-text-muted)]">Time</div>
                  {timeSlots.map((time, index) => (
                    <div key={time} className={`h-10 border-b border-[var(--color-border)] flex items-center justify-center text-xs ${index % 2 === 0 ? 'bg-[var(--color-bg-secondary)]' : 'bg-[var(--color-bg-primary)]'}`}>{time}</div>
                  ))}
                </div>

                <div className="flex-1 relative">
                  <div className="h-16 border-b border-[var(--color-border)] flex items-center justify-center">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{currentTime.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                  </div>
                  <div className="relative px-1">
                    {timeSlots.map((time, index) => (
                      <div key={time} className={`h-10 border-b border-[var(--color-border)] ${index % 2 === 0 ? 'bg-[var(--color-bg-secondary)]' : 'bg-[var(--color-bg-primary)]'}`} />
                    ))}
                    {laidOutBlocks.map((block) => (
                      <div key={block.id} className={`absolute ${block.color} rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ${isCurrentBlock(block.startTime, block.endTime) ? 'ring-2 ring-white ring-opacity-50 ring-offset-2' : ''} ${block.layout.col > 0 ? 'border-l-2 border-white/20' : ''}`} style={{ top: `${timeToPosition(block.startTime)}px`, height: `${blockHeight(block.startTime, block.endTime)}px`, left: `${block.layout.left}%`, width: `calc(${block.layout.width}% - 2px)`, minHeight: '40px' }}>
                        <div className="flex justify-between items-start h-full w-full">
                          <div className="flex-1 overflow-hidden">
                            <h3 className="font-semibold truncate" title={block.title}>{block.title}</h3>
                            <p className="text-xs opacity-90">{block.startTime} - {block.endTime}</p>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                            {isCurrentBlock(block.startTime, block.endTime) && !pomodoro.isActive && (
                              <button onClick={(e) => { e.stopPropagation(); startPomodoro(block.id); }} className="p-1 hover:bg-white/20 rounded-full transition-colors" title="Start Focus Session">
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); startEditBlock(block); }} className="p-1 hover:bg-white/20 rounded-full transition-colors" title="Edit Block"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deletePlannerBlock(block.id); }} className="p-1 hover:bg-white/20 rounded-full transition-colors" title="Delete Block"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {isCurrentBlock(block.startTime, block.endTime) && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">Now</div>
                        )}
                      </div>
                    ))}
                    <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-10" style={{ top: `${timeToPosition(`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`)}px` }}>
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
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
            <div className="bg-[var(--color-bg-primary)] rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{editingBlock ? 'Edit Block' : 'Add New Block'}</h2>
                <button onClick={() => { setShowAddBlockModal(false); setEditingBlock(null); setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' }); }} className="p-2 hover:bg-[var(--color-button-secondary-hover)] rounded-full transition-colors"><X className="w-5 h-5 text-[var(--color-text-secondary)]" /></button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Block Title</label>
                  <input type="text" placeholder="Enter title" value={newBlockData.title} onChange={(e) => setNewBlockData({ ...newBlockData, title: e.target.value })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Start Time</label>
                    <input type="time" value={newBlockData.startTime} onChange={(e) => setNewBlockData({ ...newBlockData, startTime: e.target.value })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">End Time</label>
                    <input type="time" value={newBlockData.endTime} onChange={(e) => setNewBlockData({ ...newBlockData, endTime: e.target.value })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Color</label>
                  <select value={newBlockData.color} onChange={(e) => setNewBlockData({ ...newBlockData, color: e.target.value })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]">
                    {colors.map(color => (<option key={color} value={color}>{color.split('-')[1].charAt(0).toUpperCase() + color.split('-')[1].slice(1)}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={editingBlock ? saveEditBlock : addPlannerBlock} className="flex-1 bg-[var(--color-button-primary)] hover:bg-[var(--color-button-primary-hover)] text-[var(--color-text-on-primary)] py-2 px-4 rounded-lg transition-colors">{editingBlock ? 'Save' : 'Add'}</button>
                <button onClick={() => { setShowAddBlockModal(false); setEditingBlock(null); setNewBlockData({ title: '', startTime: '', endTime: '', color: 'bg-blue-500' }); }} className="flex-1 bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)] py-2 px-4 rounded-lg transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )
      }

      {
        showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-bg-primary)] rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Work Time Settings</h2>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-[var(--color-button-secondary-hover)] rounded-full transition-colors"><X className="w-5 h-5 text-[var(--color-text-secondary)]" /></button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Work Day Start</label>
                  <input type="time" value={modalSettings.startTime} onChange={(e) => setModalSettings({ ...modalSettings, startTime: e.target.value })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Work Day End</label>
                  <input type="time" value={modalSettings.endTime} onChange={(e) => setModalSettings({ ...modalSettings, endTime: e.target.value })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Work Session (min)</label>
                    <input type="number" min="1" value={modalSettings.pomodoroWorkDuration} onChange={(e) => setModalSettings({ ...modalSettings, pomodoroWorkDuration: parseInt(e.target.value, 10) || 0 })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Break (min)</label>
                    <input type="number" min="1" value={modalSettings.pomodoroBreakDuration} onChange={(e) => setModalSettings({ ...modalSettings, pomodoroBreakDuration: parseInt(e.target.value, 10) || 0 })} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent bg-[var(--color-bg-secondary)]" />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={handleSaveSettings} className="flex-1 bg-[var(--color-button-primary)] hover:bg-[var(--color-button-primary-hover)] text-[var(--color-text-on-primary)] py-2 px-4 rounded-lg transition-colors">Save</button>
                <button onClick={() => setShowSettingsModal(false)} className="flex-1 bg-[var(--color-button-secondary)] hover:bg-[var(--color-button-secondary-hover)] text-[var(--color-text-secondary)] py-2 px-4 rounded-lg transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App
