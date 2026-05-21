import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller";
import { validate } from "../../middleware/validate.middleware";
import { createSubscriptionSchema } from "./subscriptions.validation";
import { asyncHandler } from "../../utils/async-handler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("DRIVER"),
  validate(createSubscriptionSchema),
  asyncHandler(subscriptionsController.createOrRenew)
);

export const subscriptionsRoutes = router;
