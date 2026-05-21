import { Router } from "express";
import { authController } from "./auth.controller";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validation";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(authController.register));
router.post("/login", validate(loginSchema), asyncHandler(authController.login));
router.post("/refresh", validate(refreshSchema), asyncHandler(authController.refresh));

export const authRoutes = router;
