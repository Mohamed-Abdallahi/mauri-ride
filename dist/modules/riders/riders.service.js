"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ridersService = void 0;
const prisma_1 = require("../../services/prisma");
exports.ridersService = {
    async listMyTrips(riderId, limit = 20) {
        return prisma_1.prisma.trip.findMany({
            where: { riderId },
            include: {
                driver: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: limit
        });
    }
};
