'use server';

import prisma from '@/lib/prisma';

export async function fetchServerData(userId: string) {
  try {
    const habits = await prisma.habit.findMany(); // Adjust if you have user-specific habits
    const logs = await prisma.log.findMany({
      where: { userId: userId }
    });

    return { success: true, data: { habits, logs } };
  } catch (error) {
    console.error("Failed to fetch server data:", error);
    return { success: false, error: "Database fetch failed" };
  }
}