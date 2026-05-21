"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const prisma_1 = require("./services/prisma");
const redis_1 = require("./services/redis");
const sockets_1 = require("./sockets");
const httpServer = http_1.default.createServer(app_1.app);
(0, sockets_1.initSockets)(httpServer);
const start = async () => {
    await prisma_1.prisma.$connect();
    await redis_1.redis.ping();
    httpServer.listen(env_1.env.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server listening on ${env_1.env.port}`);
    });
};
void start();
