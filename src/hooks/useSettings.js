import { useState, useEffect } from 'react';
import { openDB } from '../utils/db';

export function useSettings() {
  const [settings, setSettings] = useState({
    locale: 'ru-RU',
    theme: 'system',
    weekStart: 0,
    hideGlobal: false,
    hideLocal: false,
    nsfwTags: '',
    viewMode: 'list',
  });

  useEffect(() => {
    // Load settings on mount
    openDB().then(db => {
       const transaction = db.transaction(['settings'], 'readonly');
       const settingsStore = transaction.objectStore('settings');
       const request = settingsStore.getAll();
       request.onsuccess = () => {
         const result = request.result || [];
         const newSettings = { ...settings };
         result.forEach(item => {
           if (newSettings.hasOwnProperty(item.id)) {
             newSettings[item.id] = item.value;
           }
         });
         setSettings(newSettings);
       };
    });
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    openDB().then(db => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const settingsStore = transaction.objectStore('settings');
      settingsStore.put({ id: key, value: value });
    });
  };

  return { settings, updateSetting };
}
