import { prisma } from "../../services/prisma";

export const ridersService = {
  async listMyTrips(riderId: string, limit = 20) {
    return prisma.trip.findMany({
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
