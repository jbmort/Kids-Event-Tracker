import { z } from 'zod';

export const LogSchema = z.object({
  id: z.uuid(),
  habitId: z.uuid(),
  userId: z.string(),
  timestamp: z.coerce.date(),
  description: z.string().max(200).nullable(),
  scaleValue: z.number().min(1).max(10).nullable(),
});

export type LogInput = z.infer<typeof LogSchema>;