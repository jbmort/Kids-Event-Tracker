"use server"

import prisma from "@/lib/prisma"; 
import { LogInput, LogSchema } from "@/lib/validation/log";

/**
 * Creates a new log entry in the database.
 * This action is used by the client to record an activity.
 * Note: If the device is offline, the frontend should handle 
 * queuing this data in localStorage before attempting this action.
 */
export async function createLog(data: unknown) {
  const validatedData = LogSchema.safeParse(data);

  if (!validatedData.success) {
    return { success: false, error: validatedData.error.message };
  }

  try {
    const log: LogInput = await prisma.log.create({
      data: {
        habitId: validatedData.data.habitId,
        userId: validatedData.data.userId,
        timestamp: new Date(validatedData.data.timestamp),
        scaleValue: validatedData.data.scaleValue,
        description: validatedData.data.description,
      },
    });

    return { success: true, data: log };
  } catch (error) {
    console.error("Error creating log:", error);
    return { success: false, error: "Failed to create log" };
  }
}
