import { prisma } from "../../services/prisma";
import { locationService } from "../../services/location.service";
import { ApiError } from "../../utils/api-error";
import { subscriptionsService } from "../subscriptions/subscriptions.service";

export const driversService = {
  async goOnline(userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      throw new ApiError(404, "Driver profile not found");
    }

    await subscriptionsService.ensureActiveForDriver(driver.id);

    return prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline: true, isAvailable: true }
    });
  },

  async goOffline(userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      throw new ApiError(404, "Driver profile not found");
    }

    await locationService.removeDriverLocation(driver.id);

    return prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline: false, isAvailable: false }
    });
  },

  async updateLocation(userId: string, lat: number, lng: number) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      throw new ApiError(404, "Driver profile not found");
    }

    await subscriptionsService.ensureActiveForDriver(driver.id);
    await locationService.setDriverLocation(driver.id, { lat, lng });

    return prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLocation: { lat, lng },
        isOnline: true
      }
    });
  }
};
