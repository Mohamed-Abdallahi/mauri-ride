import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listEarningsSchema } from "./earnings.validation";
import { asyncHandler } from "../../utils/async-handler";
import { earningsController } from "./earnings.controller";

const router = Router();

router.get(
  "/me",
  requireAuth,
  requireRole("DRIVER"),
  validate(listEarningsSchema),
  asyncHandler(earningsController.listMine)
);

export const earningsRoutes = router;
