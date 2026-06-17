import { z } from 'zod';

export const LogSchema = z.object({
  habitId: z.uuid(),
  userId: z.uuid(),
  timestamp: z.date(),
  description: z.string().max(200).nullable(),
  scaleValue: z.number().min(1).max(10).nullable(),
});

export type LogInput = z.infer<typeof LogSchema>;