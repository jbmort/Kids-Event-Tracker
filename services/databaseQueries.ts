import  prisma  from "@/lib/prisma";
import { InitialData } from '@/lib/types';

/**
 * Fetches all habits and logs for the initial page load.
 * This is called in a Server Component.
 */
export async function getInitialData(): Promise<InitialData> {
  try {
    const [habits, logs] = await Promise.all([
      prisma.habit.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.log.findMany({
        orderBy: { timestamp: 'desc' },
        take: 500, // Adjust based on typical usage
      }),
    ]);

    return {
      habits,
      logs,
    };
  } catch (error) {
    console.error("Failed to fetch initial data from database:", error);
    // Return empty arrays so the page still loads even if DB is temporarily unreachable
    // The client-side hydration will then attempt to fill in local storage data.
    return {
      habits: [],
      logs: [],
    };
  }
}