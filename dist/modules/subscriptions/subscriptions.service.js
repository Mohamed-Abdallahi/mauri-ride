"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../services/prisma");
const api_error_1 = require("../../utils/api-error");
exports.subscriptionsService = {
    async createOrRenewForUser(userId, paymentReference, months = 1) {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver profile not found");
        }
        const now = new Date();
        const active = await prisma_1.prisma.subscription.findFirst({
            where: {
                driverId: driver.id,
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: { gt: now },
            },
            orderBy: { endDate: "desc" },
        });
        const startDate = active?.endDate && active.endDate > now ? active.endDate : now;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);
        if (active) {
            await prisma_1.prisma.subscription.update({
                where: { id: active.id },
                data: { status: client_1.SubscriptionStatus.CANCELED },
            });
        }
        const subscription = await prisma_1.prisma.subscription.create({
            data: {
                driverId: driver.id,
                status: client_1.SubscriptionStatus.ACTIVE,
                startDate,
                endDate,
                paymentReference,
            },
        });
        return subscription;
    },
    async ensureActiveForDriver(driverId) {
        const now = new Date();
        const sub = await prisma_1.prisma.subscription.findFirst({
            where: {
                driverId,
                status: client_1.SubscriptionStatus.ACTIVE,
                endDate: { gt: now },
            },
            orderBy: { endDate: "desc" },
        });
        // if (!sub) {
        //   await prisma.driver.update({
        //     where: { id: driverId },
        //     data: { isOnline: false, isAvailable: false }
        //   });
        //   throw new ApiError(403, "Active subscription required");
        // }
        return sub;
    },
};
