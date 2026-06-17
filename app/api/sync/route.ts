import { NextRequest } from 'next/server'; // Changed from NextApiRequest as this is App Router
import prisma from '@/lib/prisma';
import { LogSchema } from '@/lib/validation/log';
import { HabitSchema } from '@/lib/validation/habit'; // Assuming you have a schema for habits

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // standard way to parse body in App Router
    const logsToSync = body.logs || [];
    const habitsToSync = body.habits || [];

    // Process Logs
    const logPromises = logsToSync.map(async (item: unknown) => {
      const result = LogSchema.safeParse(item);
      if (result.success) {
        return prisma.log.create({
          data: {
            id: result.data.id || Math.random().toString(36).substring(2, 15),
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

    // Process Habits
    const habitPromises = habitsToSync.map(async (item: unknown) => {
      const result = HabitSchema.safeParse(item);
      if (result.success) {
        return prisma.habit.create({
          data: {
            id: result.data.id || Math.random().toString(36).substring(2, 15),
            name: result.data.name,
            scaleValues: result.data.scaleValues,
            icon: result.data.icon,
            createdAt: result.data.createdAt,
          },
        });
      } else {
        console.error("Invalid habit data:", result.error);
        return null;
      }
    });

    // Wait for all operations to complete
    await Promise.all([...logPromises, ...habitPromises]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Sync API Error:", error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to sync' }), { status: 500 });
  }
}