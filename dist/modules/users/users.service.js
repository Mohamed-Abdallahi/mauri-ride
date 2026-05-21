"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const prisma_1 = require("../../services/prisma");
exports.usersService = {
    async getMe(userId) {
        return prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                driver: true
            }
        });
    },
    async listUsers(role) {
        return prisma_1.prisma.user.findMany({
            where: role ? { role } : undefined,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" }
        });
    }
};
