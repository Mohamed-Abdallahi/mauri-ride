import { Router } from "express";
import { usersController } from "./users.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { listUsersSchema } from "./users.validation";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

router.get("/me", requireAuth, asyncHandler(usersController.me));
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate(listUsersSchema),
  asyncHandler(usersController.list)
);

export const usersRoutes = router;
