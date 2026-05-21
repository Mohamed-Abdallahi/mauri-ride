import { z } from "zod";

export const createSubscriptionSchema = z.object({
  body: z.object({
    paymentReference: z.string().min(3),
    months: z.number().int().positive().max(12).optional()
  })
});
