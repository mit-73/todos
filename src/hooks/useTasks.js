import { useState, useEffect, useCallback } from 'react';
import { openDB } from '../utils/db';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['tasks', 'archived'], 'readonly');
      const taskStore = transaction.objectStore('tasks');
      const archivedStore = transaction.objectStore('archived');
      
      const p1 = new Promise((resolve) => {
          taskStore.getAll().onsuccess = (e) => resolve(e.target.result || []);
      });
      const p2 = new Promise((resolve) => {
          archivedStore.getAll().onsuccess = (e) => resolve(e.target.result || []);
      });

      const [t, a] = await Promise.all([p1, p2]);
      setTasks(t);
      setArchivedTasks(a);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const addTask = async (task) => {
     setTasks(prev => [...prev, task]);
     try {
        const db = await openDB();
        const tx = db.transaction(['tasks'], 'readwrite');
        tx.objectStore('tasks').put(task);
     } catch (error) {
        console.error("Failed to add task", error);
        loadData();
     }
  };

  const updateTask = async (task) => {
     setTasks(prev => prev.map(t => t.id === task.id ? task : t));
     try {
        const db = await openDB();
        const tx = db.transaction(['tasks'], 'readwrite');
        tx.objectStore('tasks').put(task);
     } catch (error) {
        console.error("Failed to update task", error);
        // Revert or reload
        loadData();
     }
  };

  const batchUpdateTasks = async (updatedTasks) => {
      // Optimistic update
      setTasks(prev => prev.map(t => {
          const found = updatedTasks.find(u => u.id === t.id);
          return found ? found : t;
      }));

      try {
        const db = await openDB();
        const tx = db.transaction(['tasks'], 'readwrite');
        const store = tx.objectStore('tasks');
        updatedTasks.forEach(task => store.put(task));
      } catch (error) {
         console.error("Failed to batch update tasks", error);
         loadData();
      }
  };

  const deleteTask = async (id) => {
     setTasks(prev => prev.filter(t => t.id !== id));
     try {
        const db = await openDB();
        const tx = db.transaction(['tasks'], 'readwrite');
        tx.objectStore('tasks').delete(id);
     } catch (error) {
        console.error("Failed to delete task", error);
        loadData();
     }
  };
  
  const archiveTask = async (task) => {
     const archived = { ...task, archivedAt: new Date().toISOString() };
     
     setTasks(prev => prev.filter(t => t.id !== task.id));
     setArchivedTasks(prev => [...prev, archived]);

     try {
        const db = await openDB();
        const tx = db.transaction(['tasks', 'archived'], 'readwrite');
        tx.objectStore('tasks').delete(task.id);
        tx.objectStore('archived').put(archived);
     } catch (error) {
        console.error("Failed to archive task", error);
        loadData();
     }
  };

  const restoreTask = async (task) => {
     const restored = { ...task, completed: false };
     delete restored.archivedAt;

     setArchivedTasks(prev => prev.filter(t => t.id !== task.id));
     setTasks(prev => [...prev, restored]);

     try {
        const db = await openDB();
        const tx = db.transaction(['tasks', 'archived'], 'readwrite');
        tx.objectStore('archived').delete(task.id);
        tx.objectStore('tasks').put(restored);
     } catch (error) {
         console.error("Failed to restore task", error);
         loadData();
     }
  };

  const deleteArchivedTask = async (id) => {
     setArchivedTasks(prev => prev.filter(t => t.id !== id));
     try {
        const db = await openDB();
        const tx = db.transaction(['archived'], 'readwrite');
        tx.objectStore('archived').delete(id);
     } catch (error) {
        console.error("Failed to delete archived task", error);
        loadData();
     }
  };

  return {
    tasks,
    archivedTasks,
    isLoading,
    addTask,
    updateTask,
    batchUpdateTasks,
    deleteTask,
    archiveTask,
    restoreTask,
    deleteArchivedTask,
    setTasks,
    setArchivedTasks, // Exposed for import feature
    refreshTasks: loadData
  };
}