import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { env } from "../config/env";
import { redis } from "../services/redis";

export type AccessTokenPayload = {
  sub: string;
  r: "RIDER" | "DRIVER" | "ADMIN";
};

export type RefreshTokenPayload = {
  sub: string;
  tid: string;
};

const ACCESS_TOKEN_LENGTH = 8;
const ACCESS_TOKEN_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const parseDurationToSeconds = (value: string) => {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 15 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  return amount * 60 * 60 * 24;
};

const accessTokenTtlSeconds = parseDurationToSeconds(env.accessTokenTtl);

const createOpaqueToken = () => {
  const bytes = randomBytes(ACCESS_TOKEN_LENGTH);
  let token = "";

  for (let i = 0; i < ACCESS_TOKEN_LENGTH; i += 1) {
    token += ACCESS_TOKEN_ALPHABET[bytes[i] % ACCESS_TOKEN_ALPHABET.length];
  }

  return token;
};

export const signAccessToken = async (payload: AccessTokenPayload) => {
  const token = createOpaqueToken();
  await redis.set(
    `at:${token}`,
    JSON.stringify(payload),
    "EX",
    accessTokenTtlSeconds,
  );
  return token;
};

export const signRefreshToken = (payload: RefreshTokenPayload) => {
  return jwt.sign(
    payload,
    env.jwtRefreshSecret as Secret,
    {
      expiresIn: env.refreshTokenTtl,
      noTimestamp: true,
    } as SignOptions,
  );
};

export const verifyAccessToken = async (token: string) => {
  const raw = await redis.get(`at:${token}`);
  if (!raw) {
    throw new Error("Invalid or expired token");
  }

  return JSON.parse(raw) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
};
