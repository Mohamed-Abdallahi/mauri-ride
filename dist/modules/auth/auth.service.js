"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../services/prisma");
const api_error_1 = require("../../utils/api-error");
const jwt_1 = require("../../utils/jwt");
const hashToken = async (token) => bcryptjs_1.default.hash(token, 10);
exports.authService = {
    async register(input) {
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            throw new api_error_1.ApiError(409, "Email already exists");
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                password: passwordHash,
                role: input.role,
                driver: input.role === "DRIVER"
                    ? {
                        create: {
                            vehicleInfo: input.vehicleInfo ?? {}
                        }
                    }
                    : undefined
            }
        });
        return user;
    },
    async login(input) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
        if (!user) {
            throw new api_error_1.ApiError(401, "Invalid credentials");
        }
        const ok = await bcryptjs_1.default.compare(input.password, user.password);
        if (!ok) {
            throw new api_error_1.ApiError(401, "Invalid credentials");
        }
        const tokenRecord = await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: "placeholder",
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
        const accessToken = await (0, jwt_1.signAccessToken)({ sub: user.id, r: user.role });
        const refreshToken = (0, jwt_1.signRefreshToken)({ sub: user.id, tid: tokenRecord.id });
        await prisma_1.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { tokenHash: await hashToken(refreshToken) }
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    },
    async refresh(token) {
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        const tokenRecord = await prisma_1.prisma.refreshToken.findUnique({
            where: { id: payload.tid },
            include: { user: true }
        });
        if (!tokenRecord || tokenRecord.userId !== payload.sub || tokenRecord.revokedAt) {
            throw new api_error_1.ApiError(401, "Invalid refresh token");
        }
        if (tokenRecord.expiresAt < new Date()) {
            throw new api_error_1.ApiError(401, "Refresh token expired");
        }
        const valid = await bcryptjs_1.default.compare(token, tokenRecord.tokenHash);
        if (!valid) {
            throw new api_error_1.ApiError(401, "Invalid refresh token");
        }
        await prisma_1.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() }
        });
        const newTokenRecord = await prisma_1.prisma.refreshToken.create({
            data: {
                userId: tokenRecord.user.id,
                tokenHash: "placeholder",
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
        const accessToken = await (0, jwt_1.signAccessToken)({
            sub: tokenRecord.user.id,
            r: tokenRecord.user.role
        });
        const refreshToken = (0, jwt_1.signRefreshToken)({
            sub: tokenRecord.user.id,
            tid: newTokenRecord.id
        });
        await prisma_1.prisma.refreshToken.update({
            where: { id: newTokenRecord.id },
            data: { tokenHash: await hashToken(refreshToken) }
        });
        return { accessToken, refreshToken };
    }
};
