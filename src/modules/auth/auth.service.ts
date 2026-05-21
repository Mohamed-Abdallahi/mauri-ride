import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../../services/prisma";
import { ApiError } from "../../utils/api-error";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { LoginBody, RegisterBody } from "./auth.types";

const hashToken = async (token: string) => bcrypt.hash(token, 10);

export const authService = {
  async register(input: RegisterBody) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ApiError(409, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        role: input.role as Role,
        driver:
          input.role === "DRIVER"
            ? {
                create: {
                  vehicleInfo: input.vehicleInfo ?? {},
                },
              }
            : undefined,
      },
    });

    return user;
  },

  async login(input: LoginBody) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) {
      throw new ApiError(401, "Invalid credentials");
    }

    const tokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: "placeholder",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = await signAccessToken({ sub: user.id, r: user.role });
    const refreshToken = signRefreshToken({
      sub: user.id,
      tid: tokenRecord.id,
    });

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { tokenHash: await hashToken(refreshToken) },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { id: payload.tid },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.userId !== payload.sub ||
      tokenRecord.revokedAt
    ) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token expired");
    }

    const valid = await bcrypt.compare(token, tokenRecord.tokenHash);
    if (!valid) {
      throw new ApiError(401, "Invalid refresh token");
    }

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    const newTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        tokenHash: "placeholder",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = await signAccessToken({
      sub: tokenRecord.user.id,
      r: tokenRecord.user.role,
    });

    const refreshToken = signRefreshToken({
      sub: tokenRecord.user.id,
      tid: newTokenRecord.id,
    });

    await prisma.refreshToken.update({
      where: { id: newTokenRecord.id },
      data: { tokenHash: await hashToken(refreshToken) },
    });

    return { accessToken, refreshToken };
  },
};
