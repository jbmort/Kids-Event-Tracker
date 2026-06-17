import { z } from 'zod';

export const LogSchema = z.object({
  habitId: z.uuid(),
  userId: z.uuid(),
  timestamp: z.date(),
  description: z.string().max(200).optional().nullable(),
  scaleValue: z.number().min(1).max(10),
});

export type LogInput = z.infer<typeof LogSchema>;