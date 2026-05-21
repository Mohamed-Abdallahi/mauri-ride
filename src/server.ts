import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./services/prisma";
import { redis } from "./services/redis";
import { initSockets } from "./sockets";

const httpServer = http.createServer(app);
initSockets(httpServer);

const start = async () => {
  await prisma.$connect();
  await redis.ping();

  httpServer.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on ${env.port}`);
  });
};

void start();
