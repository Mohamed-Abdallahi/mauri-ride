"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const api_error_1 = require("../utils/api-error");
const requireAuth = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new api_error_1.ApiError(401, "Missing or invalid authorization header"));
    }
    try {
        const token = authHeader.replace("Bearer ", "");
        const payload = await (0, jwt_1.verifyAccessToken)(token);
        req.auth = {
            userId: payload.sub,
            role: payload.r
        };
        return next();
    }
    catch {
        return next(new api_error_1.ApiError(401, "Invalid or expired token"));
    }
};
exports.requireAuth = requireAuth;
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.auth) {
            return next(new api_error_1.ApiError(401, "Unauthorized"));
        }
        if (!roles.includes(req.auth.role)) {
            return next(new api_error_1.ApiError(403, "Forbidden"));
        }
        return next();
    };
};
exports.requireRole = requireRole;
