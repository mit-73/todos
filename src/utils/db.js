export const DB_NAME = 'TaskManager';
export const DB_VERSION = 9;

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject(event.target.error);
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
      if (!taskStore.indexNames.contains('value')) taskStore.createIndex('value', 'value', { unique: false });
      if (!taskStore.indexNames.contains('effort')) taskStore.createIndex('effort', 'effort', { unique: false });

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
    };
  });
};
