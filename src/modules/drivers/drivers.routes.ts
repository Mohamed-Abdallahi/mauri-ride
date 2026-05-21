import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { driversController } from "./drivers.controller";
import { updateLocationSchema } from "./drivers.validation";

const router = Router();

router.use(requireAuth, requireRole("DRIVER"));
router.post("/go-online", asyncHandler(driversController.goOnline));
router.post("/go-offline", asyncHandler(driversController.goOffline));
router.post(
  "/location",
  validate(updateLocationSchema),
  asyncHandler(driversController.updateLocation)
);

export const driversRoutes = router;
