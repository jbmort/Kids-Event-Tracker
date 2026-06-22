"use server"

import prisma from "@/lib/prisma"; 
import { HabitInput, HabitSchema } from "@/lib/validation/habit"
import Error from "next/error";

export async function createHabit(data: unknown) {
  const validatedData = HabitSchema.safeParse(data);

  if (!validatedData.success) {
    return { success: false, error: validatedData.error.message };
  }

  try {
    const habit: HabitInput = await prisma.habit.create({
      data: {
        name: validatedData.data.name,
        color: validatedData.data.color,
        scaleValues: validatedData.data.scaleValues,
        id: validatedData.data.id,
        createdAt: validatedData.data.createdAt,
      },
      });
    return { success: true, data: habit };
  } catch (error) {
    console.error("Error creating habit:", error);
    return { success: false, error: "Failed to create habit" };
  }
}

export async function updateHabit(habitId: string, updatedData: HabitInput) {
  try {
    const updatedHabit = await prisma.habit.update({
      where: {
        id: habitId,
      },
      data: {
        name: updatedData.name,
        color: updatedData.color,
        scaleValues: updatedData.scaleValues,
        createdAt: updatedData.createdAt,
      },
    });
    return {success: true, data: updatedHabit};
  } catch (error : unknown) {
    return {success: false, error: "Failed to update habit"};
  }
}
   

export async function deleteHabit(id: string) {
  try {
    const deletedHabit = await prisma.habit.delete({
      where: {
        id: id,
      },
    });
    return { success: true, data: deletedHabit };
  } catch (error) {
    console.error("Error deleting habit:", error);
    return { success: false, error: "Failed to delete habit" };
  }
}


