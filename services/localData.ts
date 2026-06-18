import { Log, Habit } from '@/lib/types';

/**
 * Storage Keys for our two-bucket system
 */
const STORAGE_KEYS = {
  // Logs Buckets
  LOCAL_CACHE: 'local_cache_logs',
  SYNC_QUEUE: 'sync_queue_pending',
  // Habits Buckets
  HABIT_CACHE: 'local_cache_habits',
  HABIT_QUEUE: 'sync_queue_habit_pending'
};

/**
 * --- LOGS SECTION ---
 */
/**
 * Get logs that are confirmed and should always show on the calendar.
 */
export function getLocalCache(): Log[] {
  const data = localStorage.getItem(STORAGE_KEYS.LOCAL_CACHE);
  return data ? JSON.parse(data) : [];
}

/**
 * Get the queue of items waiting for server confirmation.
 */
export function getSyncQueue(): Log[] {
  const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  return data ? JSON.parse(data) : [];
}

/**
 * Add a new log to the pending sync queue.
 * This is called immediately when the user clicks "Log".
 */
export function addToSyncQueue(payload: Log) {
  const queue = getSyncQueue();
  queue.push(payload);
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

/**
 * Move items from the sync queue to local cache upon successful server response.
 */
export function moveToLocalCache(syncPayload: Log[]) {
  const cache = getLocalCache();
  const updatedCache = [...cache, ...syncPayload];
  localStorage.setItem(STORAGE_KEYS.LOCAL_CACHE, JSON.stringify(updatedCache));
  
  // Clear the queue as they are now safely in "Local Cache"
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
}

/**
 * --- HABITS SECTION ---
 */

/**
 * Get habits that are confirmed (from DB or already synced).
 */
export function getHabitCache(): Habit[] {
  const data = localStorage.getItem(STORAGE_KEYS.HABIT_CACHE);
  return data ? JSON.parse(data) : [];
}

/**
 * Get the queue of habits waiting for server confirmation (new or updated).
 */
export function getHabitQueue(): Habit[] {
  const data = localStorage.getItem(STORAGE_KEYS.HABIT_QUEUE);
  return data ? JSON.parse(data) : [];
}

export function getAllHabits(): Habit[] {
    const mainHabits = getHabitCache();
    const newHabits = getHabitQueue();

    return [...mainHabits, ...newHabits];
}

/**
 * Add a new/updated habit to the pending sync queue.
 * This is called when a user creates or edits a habit offline.
 */
export function addToHabitQueue(payload: Habit) {
  const queue = getHabitQueue();
  queue.push(payload);
  localStorage.setItem(STORAGE_KEYS.HABIT_QUEUE, JSON.stringify(queue));
}

/**
 * Move items from the habit sync queue to local cache upon successful server response.
 */
export function moveHabitsToCache(syncPayload: Habit[]) {
  const cache = getHabitCache();

  // Note: In a production app, you might want to filter out
  // duplicates by ID if the user updated an existing habit.
  const uniqueIds = new Set(syncPayload.map(h => h.id));
  const filteredCache = cache.filter(h => !uniqueIds.has(h.id));

  const updatedCache = [...filteredCache, ...syncPayload];
  localStorage.setItem(STORAGE_KEYS.HABIT_CACHE, JSON.stringify(updatedCache));

  // Clear the queue
  localStorage.setItem(STORAGE_KEYS.HABIT_QUEUE, JSON.stringify([]));
}

export const isOnline = () => navigator.onLine;
