import { z } from 'zod';

export const HabitSchema = z.object({
  name: z.string().trim().min(1, "Habit must have a name").max(50),
  
  icon: z.string().trim().min(1, "Please provide an icon (e.g., 🚲)"),
});

export type HabitInput = z.infer<typeof HabitSchema>;