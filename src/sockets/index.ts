import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../services/prisma";
import { driversService } from "../modules/drivers/drivers.service";
import { tripsService } from "../modules/trips/trips.service";

let ioInstance: Server | null = null;

type RideLocation = {
  lat: number;
  lng: number;
};

type RideRequestNotification = {
  riderUserId: string;
  tripId: string;
  pickupLocation: RideLocation;
  dropoffLocation: RideLocation;
  status: string;
  candidateDriverIds: string[];
};

export const emitRideRequested = ({
  riderUserId,
  tripId,
  pickupLocation,
  dropoffLocation,
  status,
  candidateDriverIds,
}: RideRequestNotification) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`user:${riderUserId}`).emit("driver_matched", {
    tripId,
    candidates: candidateDriverIds.length,
  });

  for (const driverId of candidateDriverIds) {
    ioInstance.to(`driver:${driverId}`).emit("ride_assigned", {
      tripId,
      pickupLocation,
      dropoffLocation,
      status,
    });
  }
};

export const initSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const payload = await verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.r;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as "RIDER" | "DRIVER" | "ADMIN";

    socket.join(`user:${userId}`);

    if (role === "DRIVER") {
      const driver = await prisma.driver.findUnique({ where: { userId } });
      if (driver) {
        socket.join(`driver:${driver.id}`);
      }
    }

    socket.on("go_online", async () => {
      const driver = await driversService.goOnline(userId);
      socket.join(`driver:${driver.id}`);
      io.to(`user:${userId}`).emit("trip_status_update", { status: "ONLINE" });
    });

    socket.on("go_offline", async () => {
      const driver = await driversService.goOffline(userId);
      socket.leave(`driver:${driver.id}`);
      io.to(`user:${userId}`).emit("trip_status_update", { status: "OFFLINE" });
    });

    socket.on(
      "update_location",
      async (payload: { lat: number; lng: number }) => {
        const driver = await driversService.updateLocation(
          userId,
          payload.lat,
          payload.lng,
        );
        io.to(`driver:${driver.id}`).emit("trip_status_update", {
          type: "location_updated",
          location: payload,
        });
      },
    );

    socket.on(
      "request_ride",
      async (payload: {
        pickupLocation: { lat: number; lng: number };
        dropoffLocation: { lat: number; lng: number };
      }) => {
        const { trip, candidateDriverIds } = await tripsService.requestRide(
          userId,
          payload.pickupLocation,
          payload.dropoffLocation,
        );

        emitRideRequested({
          riderUserId: userId,
          tripId: trip.id,
          pickupLocation: payload.pickupLocation,
          dropoffLocation: payload.dropoffLocation,
          status: trip.status,
          candidateDriverIds,
        });
      },
    );

    socket.on("cancel_ride", async (payload: { tripId: string }) => {
      const trip = await tripsService.cancelRide(userId, payload.tripId);
      io.to(`user:${userId}`).emit("ride_cancelled", { tripId: trip.id });
      if (trip.driverId) {
        io.to(`driver:${trip.driverId}`).emit("ride_cancelled", {
          tripId: trip.id,
        });
      }
    });

    socket.on("accept_ride", async (payload: { tripId: string }) => {
      const trip = await tripsService.acceptRide(userId, payload.tripId);
      const candidates = await tripsService.getAndClearCandidateDrivers(
        trip.id,
      );

      io.to(`user:${trip.riderId}`).emit("driver_matched", {
        tripId: trip.id,
        driverId: trip.driverId,
      });

      for (const candidateDriverId of candidates) {
        if (candidateDriverId !== trip.driverId) {
          io.to(`driver:${candidateDriverId}`).emit("ride_cancelled", {
            tripId: trip.id,
          });
        }
      }

      io.to(`driver:${trip.driverId}`).emit("trip_status_update", {
        tripId: trip.id,
        status: "ASSIGNED",
      });
    });

    socket.on("reject_ride", async (payload: { tripId: string }) => {
      const trip = await tripsService.getTripById(payload.tripId);
      if (trip) {
        io.to(`user:${trip.riderId}`).emit("trip_status_update", {
          tripId: payload.tripId,
          status: "DRIVER_REJECTED",
        });
      }
    });

    socket.on("trip_started", async (payload: { tripId: string }) => {
      const result = await tripsService.startTrip(userId, payload.tripId);
      if (result.count) {
        const trip = await tripsService.getTripById(payload.tripId);
        if (trip) {
          io.to(`user:${trip.riderId}`).emit("trip_started", {
            tripId: trip.id,
          });
        }
      }
    });

    socket.on(
      "trip_completed",
      async (payload: { tripId: string; price?: number }) => {
        const trip = await tripsService.completeTrip(
          userId,
          payload.tripId,
          payload.price,
        );
        io.to(`user:${trip.riderId}`).emit("trip_completed", {
          tripId: trip.id,
          price: trip.price,
        });
      },
    );
  });

  return io;
};
