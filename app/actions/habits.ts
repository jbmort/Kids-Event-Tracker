"use server"

import prisma from "@/lib/prisma"; // Ensure you have a prisma client instance
import { HabitInput, HabitSchema } from "@/lib/validation/habit"

export async function createHabit(data: unknown) {
  const validatedData = HabitSchema.safeParse(data);

  if (!validatedData.success) {
    return { success: false, error: validatedData.error.message };
  }

  try {
    const habit: HabitInput = await prisma.habit.create({
      data: {
        name: validatedData.data.name,
        icon: validatedData.data.icon,
      },
    });
    return { success: true, data: habit };
  } catch (error) {
    console.error("Error creating habit:", error);
    return { success: false, error: "Failed to create habit" };
  }
}
