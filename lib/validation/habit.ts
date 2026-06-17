import { z } from 'zod';

export const HabitSchema = z.object({
  name: z.string().trim().min(1, "Habit must have a name").max(50),
  icon: z.string().trim().min(1, "Please provide an icon (e.g., 🚲)"),
  scaleValues: z.array(z.string()),
  id: z.uuid(),
  createdAt: z.date(),
});

export type HabitInput = z.infer<typeof HabitSchema>;