import { z } from "zod";

export const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(["RIDER", "DRIVER", "ADMIN"]).optional()
  })
});
