import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/api-error";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or invalid authorization header"));
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.r,
    };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.auth.role as Role)) {
      return next(new ApiError(403, "Forbidden"));
    }

    return next();
  };
};
