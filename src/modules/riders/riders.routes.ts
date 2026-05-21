import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { riderTripsSchema } from "./riders.validation";
import { asyncHandler } from "../../utils/async-handler";
import { ridersController } from "./riders.controller";

const router = Router();

router.get(
  "/me/trips",
  requireAuth,
  requireRole("RIDER"),
  validate(riderTripsSchema),
  asyncHandler(ridersController.listMyTrips)
);

export const ridersRoutes = router;
