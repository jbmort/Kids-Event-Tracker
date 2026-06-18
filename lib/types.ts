/**
 * Represents a Habit as defined in our database.
 */
export interface Habit {
  id: string;
  name: string;
  color: string;
  scaleValues: string[]; // Note: Stored as strings to handle various formats if needed, but we'll validate numbers for logic
  createdAt: Date;
}

/**
 * Represents a Log entry in the database.
 */
export interface Log {
  id: string;
  timestamp: Date;
  description?: string | null;
  scaleValue: number | null; // Validated as 1-10
  userId: string;
  habitId: string;
}

/**
 * The payload structure used for local storage and the sync API.
 */
// export interface SyncPayload {
//   habitId: string;
//   userId: string;
//   scaleValue: number; // 1-10
//   description?: string;
//   timestamp?: Date; // If missing, defaults to now during sync
// }

/**
 * The structure of the data returned from our initial fetch.
 */
export type InitialData = {
  habits: Habit[];
  logs: Log[];
};