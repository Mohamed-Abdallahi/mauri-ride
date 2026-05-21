"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driversService = void 0;
const prisma_1 = require("../../services/prisma");
const location_service_1 = require("../../services/location.service");
const api_error_1 = require("../../utils/api-error");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
exports.driversService = {
    async goOnline(userId) {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver profile not found");
        }
        await subscriptions_service_1.subscriptionsService.ensureActiveForDriver(driver.id);
        return prisma_1.prisma.driver.update({
            where: { id: driver.id },
            data: { isOnline: true, isAvailable: true }
        });
    },
    async goOffline(userId) {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver profile not found");
        }
        await location_service_1.locationService.removeDriverLocation(driver.id);
        return prisma_1.prisma.driver.update({
            where: { id: driver.id },
            data: { isOnline: false, isAvailable: false }
        });
    },
    async updateLocation(userId, lat, lng) {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver profile not found");
        }
        await subscriptions_service_1.subscriptionsService.ensureActiveForDriver(driver.id);
        await location_service_1.locationService.setDriverLocation(driver.id, { lat, lng });
        return prisma_1.prisma.driver.update({
            where: { id: driver.id },
            data: {
                currentLocation: { lat, lng },
                isOnline: true
            }
        });
    }
};
