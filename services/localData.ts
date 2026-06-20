'use client'

import { Log, Habit } from '@/lib/types';
// Import your server actions directly into the service layer 
// to allow the service to handle the "Try Online -> Fallback" logic
import { createLog } from '@/app/actions/logs';
import { createHabit } from '@/app/actions/habits';
import { fetchServerData } from '@/app/actions/dataRefresh';

/**
 * Storage Keys for our two-bucket system
 */
const STORAGE_KEYS = {
  // Logs Buckets
  LOCAL_CACHE: 'local_cache_logs',
  SYNC_QUEUE: 'sync_queue_pending',
  // Habits Buckets
  HABIT_CACHE: 'local_cache_habits',
  HABIT_QUEUE: 'sync_queue_habit_pending',
  LAST_SUCCESSFUL_SYNC: 'last_successful_sync'
};

/**
 * --- CORE STORAGE HELPERS ---
 */

export function getLocalCache(): Log[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_CACHE);
  return data ? JSON.parse(data) : [];
}

export function getSyncQueue(): Log[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  return data ? JSON.parse(data) : [];
}

export function getAllLogCache(): Log[] {
  return [...getLocalCache(), ...getSyncQueue()];
}

export function addToSyncQueue(payload: Log) {
  const queue = getSyncQueue();
  queue.push(payload);
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

export function removeFromSyncQueue(habitId: string) {
  const queue = getSyncQueue();
  const newQueue = queue.filter((h) => h.id !== habitId);
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(newQueue));
}

export function moveToLocalCache(syncPayload: Log[]) {
  const cache = getLocalCache();
  const updatedCache = [...cache, ...syncPayload];
  localStorage.setItem(STORAGE_KEYS.LOCAL_CACHE, JSON.stringify(updatedCache));
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
}

export function getHabitCache(): Habit[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEYS.HABIT_CACHE);
  return data ? JSON.parse(data) : [];
}

export function getHabitQueue(): Habit[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEYS.HABIT_QUEUE);
  return data ? JSON.parse(data) : [];
}

export function getAllHabits(): Habit[] {
  const data = [...getHabitCache(), ...getHabitQueue()];
  return data;
}

export function addToHabitQueue(payload: Habit) {
  const queue = getHabitQueue();
  queue.push(payload);
  localStorage.setItem(STORAGE_KEYS.HABIT_QUEUE, JSON.stringify(queue));
}

export function moveHabitsToCache(syncPayload: Habit[]) {
  const cache = getHabitCache();
  const uniqueIds = new Set(syncPayload.map(h => h.id));
  const filteredCache = cache.filter(h => !uniqueIds.has(h.id));

  const updatedCache = [...filteredCache, ...syncPayload];
  localStorage.setItem(STORAGE_KEYS.HABIT_CACHE, JSON.stringify(updatedCache));
  localStorage.setItem(STORAGE_KEYS.HABIT_QUEUE, JSON.stringify([]));
}

/**
 * --- SMART SYNC WRAPPERS ---
 * These are the functions your UI components should call directly.
 * They handle the "Online vs Offline" logic internally.
 */

export async function submitLog(payload: Log) {
  const online = navigator.onLine;

  if (online) {
    try {
      const result = await createLog(payload);
      if (result.success){
        moveToLocalCache([payload]);
        return { success: true, data: result.data };
      }
    } catch (e) {
      console.warn("Online attempt failed, falling back to queue", e);
    }
  }

  // Fallback for offline OR failed online attempts
  addToSyncQueue(payload);
  attemptBackgroundSync(); // Try to fire immediately in case connection just returned
  return { success: true, queued: !online }; 
}

export async function submitHabit(payload: Habit) {
  const online = navigator.onLine;

  if (online) {
    try {
      const result = await createHabit(payload);
      if (result.success){
        moveHabitsToCache([payload]);
        return { success: true, data: result.data }};
    } catch (e) {
      console.warn("Online attempt failed, falling back to queue", e);
    }
  }

  // Fallback for offline or failed online attempts
  addToHabitQueue(payload);
  attemptBackgroundSync();
  return { success: true, queued: !online };
}

/**
 * --- SYSTEM UTILS ---
 */

export const hasSuccessfulSync = () => {
  const data = localStorage.getItem(STORAGE_KEYS.LAST_SUCCESSFUL_SYNC);
  return data !== null;
};

export const setSyncSuccess = () => {
  localStorage.setItem(STORAGE_KEYS.LAST_SUCCESSFUL_SYNC, Date.now().toString());
};

export const clearSyncSuccess = () => {
  localStorage.removeItem(STORAGE_KEYS.LAST_SUCCESSFUL_SYNC);
};

export const isOnline = () => navigator.onLine;

export const initNetworkListeners = () => {
  window.addEventListener('offline', () => {
    clearSyncSuccess();
  });
};

export const attemptBackgroundSync = async () => {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const logQueueRaw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  const habitQueueRaw = localStorage.getItem(STORAGE_KEYS.HABIT_QUEUE);

  // Only proceed if there is actually something in the local queues
  const hasLogs = logQueueRaw && JSON.parse(logQueueRaw).length > 0;
  const hasHabits = habitQueueRaw && JSON.parse(habitQueueRaw).length > 0;

  if (!hasLogs && !hasHabits) return;

  const logQueue: Log[] = logQueueRaw ? JSON.parse(logQueueRaw) : [];
  const habitQueue: Habit[] = habitQueueRaw ? JSON.parse(habitQueueRaw) : [];

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logQueue, habits: habitQueue }),
    });

    if (response.ok) {
      if (logQueue.length > 0) moveToLocalCache(logQueue);
      if (habitQueue.length > 0) moveHabitsToCache(habitQueue);
      setSyncSuccess();
    } else {
      clearSyncSuccess();
    }
  } catch (error) {
    clearSyncSuccess();
    console.warn('Background sync failed, will retry next time.');
  }
};

export const pullDataFromServer = async (userId: string) => {
  // 1. Don't try if we are strictly offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  try {
    const response = await fetchServerData(userId);
    
    if (response.success && response.data) {
      // 2. Overwrite the local cache with the fresh database truth
      localStorage.setItem(STORAGE_KEYS.HABIT_CACHE, JSON.stringify(response.data.habits));
      localStorage.setItem(STORAGE_KEYS.LOCAL_CACHE, JSON.stringify(response.data.logs));
      
      // Return the fresh data so the UI can update
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Failed to pull from server", error);
    return null;
  }
};