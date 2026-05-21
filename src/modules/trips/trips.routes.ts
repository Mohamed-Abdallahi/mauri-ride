import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { completeTripSchema, requestRideSchema } from "./trips.validation";
import { tripsController } from "./trips.controller";

const router = Router();

router.post(
  "/request",
  requireAuth,
  requireRole("RIDER"),
  validate(requestRideSchema),
  asyncHandler(tripsController.requestRide)
);

router.post(
  "/:tripId/cancel",
  requireAuth,
  requireRole("RIDER"),
  asyncHandler(tripsController.cancelRide)
);

router.post(
  "/:tripId/start",
  requireAuth,
  requireRole("DRIVER"),
  asyncHandler(tripsController.startTrip)
);

router.post(
  "/:tripId/complete",
  requireAuth,
  requireRole("DRIVER"),
  validate(completeTripSchema),
  asyncHandler(tripsController.completeTrip)
);

export const tripsRoutes = router;
