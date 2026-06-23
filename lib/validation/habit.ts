import { z } from 'zod';

export const HabitSchema = z.object({
  name: z.string().trim().min(1, "Habit must have a name").max(50),
  color: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/, {message: "Invalid hex color code.",}),
  scaleValues: z.array(z.string()),
  id: z.uuid(),
  createdAt: z.coerce.date(),
});

export type HabitInput = z.infer<typeof HabitSchema>;