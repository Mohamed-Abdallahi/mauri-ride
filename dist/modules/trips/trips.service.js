"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../services/prisma");
const location_service_1 = require("../../services/location.service");
const redis_1 = require("../../services/redis");
const api_error_1 = require("../../utils/api-error");
const EARTH_RADIUS_KM = 6371;
const BASE_FARE = 2.5;
const PER_KM = 1.25;
const haversineKm = (a, b) => {
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 = Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s1 + s2));
};
const estimateFare = (pickup, dropoff) => {
    const distanceKm = haversineKm(pickup, dropoff);
    return Number((BASE_FARE + distanceKm * PER_KM).toFixed(2));
};
exports.tripsService = {
    async requestRide(riderId, pickupLocation, dropoffLocation) {
        const rider = await prisma_1.prisma.user.findUnique({ where: { id: riderId } });
        if (!rider || rider.role !== "RIDER") {
            throw new api_error_1.ApiError(403, "Only riders can request rides");
        }
        const trip = await prisma_1.prisma.trip.create({
            data: {
                riderId,
                pickupLocation,
                dropoffLocation,
                status: client_1.TripStatus.REQUESTED,
                price: new client_1.Prisma.Decimal(estimateFare(pickupLocation, dropoffLocation))
            }
        });
        const nearbyDriverIds = await location_service_1.locationService.findNearbyDrivers(pickupLocation, 5, 30);
        if (!nearbyDriverIds.length) {
            return { trip, candidateDriverIds: [] };
        }
        const now = new Date();
        const activeDrivers = await prisma_1.prisma.driver.findMany({
            where: {
                id: { in: nearbyDriverIds },
                isOnline: true,
                isAvailable: true,
                subscriptions: {
                    some: {
                        status: client_1.SubscriptionStatus.ACTIVE,
                        endDate: { gt: now }
                    }
                }
            },
            select: { id: true }
        });
        const candidateDriverIds = activeDrivers.map((d) => d.id);
        if (candidateDriverIds.length) {
            const key = `trip:candidates:${trip.id}`;
            await redis_1.redis.sadd(key, ...candidateDriverIds);
            await redis_1.redis.expire(key, 600);
        }
        return { trip, candidateDriverIds };
    },
    async cancelRide(riderId, tripId) {
        const trip = await prisma_1.prisma.trip.findFirst({
            where: {
                id: tripId,
                riderId,
                status: { in: [client_1.TripStatus.REQUESTED, client_1.TripStatus.ACCEPTED] }
            }
        });
        if (!trip) {
            throw new api_error_1.ApiError(404, "Cancelable trip not found");
        }
        const updated = await prisma_1.prisma.trip.update({
            where: { id: tripId },
            data: {
                status: client_1.TripStatus.CANCELLED,
                cancelledAt: new Date()
            }
        });
        if (trip.driverId) {
            await prisma_1.prisma.driver.update({
                where: { id: trip.driverId },
                data: { isAvailable: true }
            });
        }
        return updated;
    },
    async acceptRide(driverUserId, tripId) {
        const driver = await prisma_1.prisma.driver.findUnique({
            where: { userId: driverUserId },
            include: {
                subscriptions: {
                    where: {
                        status: client_1.SubscriptionStatus.ACTIVE,
                        endDate: { gt: new Date() }
                    },
                    take: 1
                }
            }
        });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver not found");
        }
        if (!driver.isOnline || !driver.isAvailable) {
            throw new api_error_1.ApiError(409, "Driver is not available");
        }
        if (!driver.subscriptions.length) {
            throw new api_error_1.ApiError(403, "Active subscription required");
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const inProgress = await tx.trip.count({
                where: {
                    driverId: driver.id,
                    status: { in: [client_1.TripStatus.ACCEPTED, client_1.TripStatus.STARTED] }
                }
            });
            if (inProgress > 0) {
                throw new api_error_1.ApiError(409, "Driver already has an active trip");
            }
            const claim = await tx.trip.updateMany({
                where: {
                    id: tripId,
                    status: client_1.TripStatus.REQUESTED,
                    driverId: null
                },
                data: {
                    driverId: driver.id,
                    status: client_1.TripStatus.ACCEPTED,
                    acceptedAt: new Date()
                }
            });
            if (claim.count !== 1) {
                throw new api_error_1.ApiError(409, "Trip already assigned");
            }
            await tx.driver.update({
                where: { id: driver.id },
                data: { isAvailable: false }
            });
            return tx.trip.findUniqueOrThrow({ where: { id: tripId } });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    },
    async startTrip(driverUserId, tripId) {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId: driverUserId } });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver not found");
        }
        const result = await prisma_1.prisma.trip.updateMany({
            where: {
                id: tripId,
                driverId: driver.id,
                status: client_1.TripStatus.ACCEPTED
            },
            data: {
                status: client_1.TripStatus.STARTED,
                startedAt: new Date()
            }
        });
        if (!result.count) {
            throw new api_error_1.ApiError(409, "Trip cannot be started");
        }
        return result;
    },
    async completeTrip(driverUserId, tripId, finalPrice) {
        const driver = await prisma_1.prisma.driver.findUnique({ where: { userId: driverUserId } });
        if (!driver) {
            throw new api_error_1.ApiError(404, "Driver not found");
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const trip = await tx.trip.findFirst({
                where: {
                    id: tripId,
                    driverId: driver.id,
                    status: client_1.TripStatus.STARTED
                }
            });
            if (!trip) {
                throw new api_error_1.ApiError(404, "Active trip not found");
            }
            const price = finalPrice ?? Number(trip.price ?? 0);
            if (price <= 0) {
                throw new api_error_1.ApiError(400, "Trip price must be greater than zero");
            }
            const updatedTrip = await tx.trip.update({
                where: { id: trip.id },
                data: {
                    status: client_1.TripStatus.COMPLETED,
                    completedAt: new Date(),
                    price: new client_1.Prisma.Decimal(price)
                }
            });
            await tx.driverEarning.create({
                data: {
                    driverId: driver.id,
                    tripId: trip.id,
                    amount: new client_1.Prisma.Decimal(price)
                }
            });
            await tx.driver.update({
                where: { id: driver.id },
                data: { isAvailable: true }
            });
            return updatedTrip;
        });
    },
    async getTripById(tripId) {
        return prisma_1.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                driver: { include: { user: true } },
                rider: true
            }
        });
    },
    async getAndClearCandidateDrivers(tripId) {
        const key = `trip:candidates:${tripId}`;
        const drivers = await redis_1.redis.smembers(key);
        await redis_1.redis.del(key);
        return drivers;
    }
};
