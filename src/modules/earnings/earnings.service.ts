import { prisma } from "../../services/prisma";
import { ApiError } from "../../utils/api-error";

export const earningsService = {
  async listForDriver(userId: string, limit = 20) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) {
      throw new ApiError(404, "Driver profile not found");
    }

    const rows = await prisma.driverEarning.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { trip: true }
    });

    const agg = await prisma.driverEarning.aggregate({
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
