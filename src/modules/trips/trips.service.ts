import { Prisma, TripStatus } from "@prisma/client";
import { prisma } from "../../services/prisma";
import { locationService } from "../../services/location.service";
import { redis } from "../../services/redis";
import { ApiError } from "../../utils/api-error";

const EARTH_RADIUS_KM = 6371;
const BASE_FARE = 2.5;
const PER_KM = 1.25;

const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s1 + s2));
};

const estimateFare = (
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
) => {
  const distanceKm = haversineKm(pickup, dropoff);
  return Number((BASE_FARE + distanceKm * PER_KM).toFixed(2));
};

export const tripsService = {
  async requestRide(riderId: string, pickupLocation: { lat: number; lng: number }, dropoffLocation: { lat: number; lng: number }) {
    const rider = await prisma.user.findUnique({ where: { id: riderId } });
    if (!rider || rider.role !== "RIDER") {
      throw new ApiError(403, "Only riders can request rides");
    }

    const trip = await prisma.trip.create({
      data: {
        riderId,
        pickupLocation,
        dropoffLocation,
        status: TripStatus.REQUESTED,
        price: new Prisma.Decimal(estimateFare(pickupLocation, dropoffLocation))
      }
    });

    const nearbyDriverIds = await locationService.findNearbyDrivers(pickupLocation, 5, 30);
    if (!nearbyDriverIds.length) {
      return { trip, candidateDriverIds: [] };
    }

    const activeDrivers = await prisma.driver.findMany({
      where: {
        id: { in: nearbyDriverIds },
        isOnline: true,
        isAvailable: true
      },
      select: { id: true }
    });

    const candidateDriverIds = activeDrivers.map((d) => d.id);
    if (candidateDriverIds.length) {
      const key = `trip:candidates:${trip.id}`;
      await redis.sadd(key, ...candidateDriverIds);
      await redis.expire(key, 600);
    }

    return { trip, candidateDriverIds };
  },

  async cancelRide(riderId: string, tripId: string) {
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        riderId,
        status: { in: [TripStatus.REQUESTED, TripStatus.ACCEPTED] }
      }
    });

    if (!trip) {
      throw new ApiError(404, "Cancelable trip not found");
    }

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.CANCELLED,
        cancelledAt: new Date()
      }
    });

    if (trip.driverId) {
      await prisma.driver.update({
        where: { id: trip.driverId },
        data: { isAvailable: true }
      });
    }

    return updated;
  },

  async acceptRide(driverUserId: string, tripId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId },
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            endDate: { gt: new Date() }
          },
          take: 1
        }
      }
    });

    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }

    if (!driver.isOnline || !driver.isAvailable) {
      throw new ApiError(409, "Driver is not available");
    }

    if (!driver.subscriptions.length) {
      throw new ApiError(403, "Active subscription required");
    }

    return prisma.$transaction(
      async (tx) => {
        const inProgress = await tx.trip.count({
          where: {
            driverId: driver.id,
            status: { in: [TripStatus.ACCEPTED, TripStatus.STARTED] }
          }
        });

        if (inProgress > 0) {
          throw new ApiError(409, "Driver already has an active trip");
        }

        const claim = await tx.trip.updateMany({
          where: {
            id: tripId,
            status: TripStatus.REQUESTED,
            driverId: null
          },
          data: {
            driverId: driver.id,
            status: TripStatus.ACCEPTED,
            acceptedAt: new Date()
          }
        });

        if (claim.count !== 1) {
          throw new ApiError(409, "Trip already assigned");
        }

        await tx.driver.update({
          where: { id: driver.id },
          data: { isAvailable: false }
        });

        return tx.trip.findUniqueOrThrow({ where: { id: tripId } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  },

  async startTrip(driverUserId: string, tripId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }

    const result = await prisma.trip.updateMany({
      where: {
        id: tripId,
        driverId: driver.id,
        status: TripStatus.ACCEPTED
      },
      data: {
        status: TripStatus.STARTED,
        startedAt: new Date()
      }
    });

    if (!result.count) {
      throw new ApiError(409, "Trip cannot be started");
    }

    return result;
  },

  async completeTrip(driverUserId: string, tripId: string, finalPrice?: number) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }

    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: {
          id: tripId,
          driverId: driver.id,
          status: TripStatus.STARTED
        }
      });

      if (!trip) {
        throw new ApiError(404, "Active trip not found");
      }

      const price = finalPrice ?? Number(trip.price ?? 0);
      if (price <= 0) {
        throw new ApiError(400, "Trip price must be greater than zero");
      }

      const updatedTrip = await tx.trip.update({
        where: { id: trip.id },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
          price: new Prisma.Decimal(price)
        }
      });

      await tx.driverEarning.create({
        data: {
          driverId: driver.id,
          tripId: trip.id,
          amount: new Prisma.Decimal(price)
        }
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: { isAvailable: true }
      });

      return updatedTrip;
    });
  },

  async getTripById(tripId: string) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: { include: { user: true } },
        rider: true
      }
    });
  },

  async getAndClearCandidateDrivers(tripId: string) {
    const key = `trip:candidates:${tripId}`;
    const drivers = await redis.smembers(key);
    await redis.del(key);
    return drivers;
  }
};
