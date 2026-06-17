import { z } from 'zod';

export const LogSchema = z.object({
  habitId: z.string().uuid(),
  userId: z.string().uuid(),
  description: z.string().max(200).optional(),
  scaleValue: z.number().min(1).max(10),
});

export type LogInput = z.infer<typeof LogSchema>;