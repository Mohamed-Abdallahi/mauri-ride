import { z } from "zod";

export const listEarningsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).optional()
  })
});
