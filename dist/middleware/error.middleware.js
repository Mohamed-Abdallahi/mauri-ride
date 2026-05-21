"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const client_1 = require("@prisma/client");
const api_error_1 = require("../utils/api-error");
const errorMiddleware = (err, _req, res, _next) => {
    if (err instanceof api_error_1.ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return res.status(409).json({ message: "A unique constraint failed" });
    }
    return res.status(500).json({ message: "Internal server error" });
};
exports.errorMiddleware = errorMiddleware;
