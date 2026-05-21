import { prisma } from "../../services/prisma";

export const usersService = {
  async getMe(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        driver: true
      }
    });
  },

  async listUsers(role?: "RIDER" | "DRIVER" | "ADMIN") {
    return prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  }
};
