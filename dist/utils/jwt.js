"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const redis_1 = require("../services/redis");
const ACCESS_TOKEN_LENGTH = 8;
const ACCESS_TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const parseDurationToSeconds = (value) => {
    if (/^\d+$/.test(value)) {
        return Number(value);
    }
    const match = value.match(/^(\d+)([smhd])$/i);
    if (!match) {
        return 15 * 60;
    }
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "s")
        return amount;
    if (unit === "m")
        return amount * 60;
    if (unit === "h")
        return amount * 60 * 60;
    return amount * 60 * 60 * 24;
};
const accessTokenTtlSeconds = parseDurationToSeconds(env_1.env.accessTokenTtl);
const createOpaqueToken = () => {
    const bytes = (0, crypto_1.randomBytes)(ACCESS_TOKEN_LENGTH);
    let token = "";
    for (let i = 0; i < ACCESS_TOKEN_LENGTH; i += 1) {
        token += ACCESS_TOKEN_ALPHABET[bytes[i] % ACCESS_TOKEN_ALPHABET.length];
    }
    return token;
};
const signAccessToken = async (payload) => {
    const token = createOpaqueToken();
    await redis_1.redis.set(`at:${token}`, JSON.stringify(payload), "EX", accessTokenTtlSeconds);
    return token;
};
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtRefreshSecret, {
        expiresIn: env_1.env.refreshTokenTtl,
        noTimestamp: true
    });
};
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = async (token) => {
    const raw = await redis_1.redis.get(`at:${token}`);
    if (!raw) {
        throw new Error("Invalid or expired token");
    }
    return JSON.parse(raw);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtRefreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
