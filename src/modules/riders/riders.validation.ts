import { z } from "zod";

export const riderTripsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).optional()
  })
});
