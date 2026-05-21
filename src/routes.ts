import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { driversRoutes } from "./modules/drivers/drivers.routes";
import { ridersRoutes } from "./modules/riders/riders.routes";
import { subscriptionsRoutes } from "./modules/subscriptions/subscriptions.routes";
import { tripsRoutes } from "./modules/trips/trips.routes";
import { earningsRoutes } from "./modules/earnings/earnings.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/drivers", driversRoutes);
router.use("/riders", ridersRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/trips", tripsRoutes);
router.use("/earnings", earningsRoutes);

export const appRoutes = router;
