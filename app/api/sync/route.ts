// app/api/sync/route.ts
import { NextRequest } from 'next/server'; // Changed from NextApiRequest as this is App Router
import prisma from '@/lib/prisma';
import { LogSchema } from '@/lib/validation/log';
import { HabitSchema } from '@/lib/validation/habit'; // Assuming you have a schema for habits

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // standard way to parse body in App Router
    const logsToSync = body.logs || [];
    const habitsToSync = body.habits || [];

    // ==========================================
    // WAVE 1: Process and Resolve Habits FIRST
    // ==========================================
    const habitPromises = habitsToSync.map(async (item: unknown) => {
      const result = HabitSchema.safeParse(item);
      if (result.success) {
        const id = result.data.id
        
        // We use upsert to prevent crashes if the same Habit is synced twice
        return prisma.habit.upsert({
          where: { id },
          update: {
            name: result.data.name,
            scaleValues: result.data.scaleValues,
            color: result.data.color,
            createdAt: result.data.createdAt,
          },
          create: {
            id,
            name: result.data.name,
            scaleValues: result.data.scaleValues,
            color: result.data.color,
            createdAt: result.data.createdAt,
          },
        });
      } else {
        console.error("Invalid habit data:", result.error);
        return null;
      }
    });

    // Wait for all Habits to finish writing before we touch the Logs!
    await Promise.all(habitPromises);

    // ==========================================
    // WAVE 2: Process and Resolve Logs SECOND
    // ==========================================
    const logPromises = logsToSync.map(async (item: unknown) => {
      const result = LogSchema.safeParse(item);
      if (result.success) {
        const id = result.data.id

        // We use upsert to prevent crashes if the same Log is synced twice
        return prisma.log.upsert({
          where: { id },
          update: {
            timestamp: new Date(result.data.timestamp),
            scaleValue: result.data.scaleValue?.toString().isWellFormed() ? Number(result.data.scaleValue) : 5,
            description: result.data.description,
            userId: result.data.userId,
            habitId: result.data.habitId,
          },
          create: {
            id,
            timestamp: new Date(result.data.timestamp),
            scaleValue: result.data.scaleValue?.toString().isWellFormed() ? Number(result.data.scaleValue) : 5,
            description: result.data.description,
            userId: result.data.userId,
            habitId: result.data.habitId,
          },
        });
      } else {
        console.error("Invalid log data:", result.error);
        return null;
      }
    });

    // Now resolve all logs concurrently
    await Promise.all(logPromises);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Sync API Error:", error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to sync' }), { status: 500 });
  }
}