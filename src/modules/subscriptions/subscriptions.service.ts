import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../services/prisma";
import { ApiError } from "../../utils/api-error";

export const subscriptionsService = {
  async createOrRenewForUser(
    userId: string,
    paymentReference: string,
    months = 1,
  ) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      throw new ApiError(404, "Driver profile not found");
    }

    const now = new Date();
    const active = await prisma.subscription.findFirst({
      where: {
        driverId: driver.id,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gt: now },
      },
      orderBy: { endDate: "desc" },
    });

    const startDate =
      active?.endDate && active.endDate > now ? active.endDate : now;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    if (active) {
      await prisma.subscription.update({
        where: { id: active.id },
        data: { status: SubscriptionStatus.CANCELED },
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        driverId: driver.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        paymentReference,
      },
    });

    return subscription;
  },

  async ensureActiveForDriver(driverId: string) {
    const now = new Date();
    const sub = await prisma.subscription.findFirst({
      where: {
        driverId,
        status: SubscriptionStatus.ACTIVE,
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
