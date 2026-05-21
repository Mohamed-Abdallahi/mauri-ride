"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.earningsService = void 0;
const prisma_1 = require("../../services/prisma");
const api_error_1 = require("../../utils/api-error");
exports.earningsService = {
    async listForDriver(userId, limit = 20) {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver profile not found");
        }
        const rows = await prisma_1.prisma.driverEarning.findMany({
            where: { driverId: driver.id },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { trip: true }
        });
        const agg = await prisma_1.prisma.driverEarning.aggregate({
            where: { driverId: driver.id },
            _sum: { amount: true },
            _count: { _all: true }
        });
        return {
            items: rows,
            summary: {
                total: Number(agg._sum.amount ?? 0),
                trips: agg._count._all
            }
        };
    }
};
