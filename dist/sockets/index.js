"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSockets = exports.emitRideRequested = void 0;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../services/prisma");
const drivers_service_1 = require("../modules/drivers/drivers.service");
const trips_service_1 = require("../modules/trips/trips.service");
let ioInstance = null;
const emitRideRequested = ({ riderUserId, tripId, pickupLocation, dropoffLocation, status, candidateDriverIds }) => {
    if (!ioInstance) {
        return;
    }
    ioInstance.to(`user:${riderUserId}`).emit("driver_matched", {
        tripId,
        candidates: candidateDriverIds.length
    });
    for (const driverId of candidateDriverIds) {
        ioInstance.to(`driver:${driverId}`).emit("ride_assigned", {
            tripId,
            pickupLocation,
            dropoffLocation,
            status
        });
    }
};
exports.emitRideRequested = emitRideRequested;
const initSockets = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*"
        }
    });
    ioInstance = io;
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Unauthorized"));
        }
        try {
            const payload = await (0, jwt_1.verifyAccessToken)(token);
            socket.data.userId = payload.sub;
            socket.data.role = payload.r;
            return next();
        }
        catch {
            return next(new Error("Unauthorized"));
        }
    });
    io.on("connection", async (socket) => {
        const userId = socket.data.userId;
        const role = socket.data.role;
        socket.join(`user:${userId}`);
        if (role === "DRIVER") {
            const driver = await prisma_1.prisma.driver.findUnique({ where: { userId } });
            if (driver) {
                socket.join(`driver:${driver.id}`);
            }
        }
        socket.on("go_online", async () => {
            const driver = await drivers_service_1.driversService.goOnline(userId);
            socket.join(`driver:${driver.id}`);
            io.to(`user:${userId}`).emit("trip_status_update", { status: "ONLINE" });
        });
        socket.on("go_offline", async () => {
            const driver = await drivers_service_1.driversService.goOffline(userId);
            socket.leave(`driver:${driver.id}`);
            io.to(`user:${userId}`).emit("trip_status_update", { status: "OFFLINE" });
        });
        socket.on("update_location", async (payload) => {
            const driver = await drivers_service_1.driversService.updateLocation(userId, payload.lat, payload.lng);
            io.to(`driver:${driver.id}`).emit("trip_status_update", {
                type: "location_updated",
                location: payload
            });
        });
        socket.on("request_ride", async (payload) => {
            const { trip, candidateDriverIds } = await trips_service_1.tripsService.requestRide(userId, payload.pickupLocation, payload.dropoffLocation);
            (0, exports.emitRideRequested)({
                riderUserId: userId,
                tripId: trip.id,
                pickupLocation: payload.pickupLocation,
                dropoffLocation: payload.dropoffLocation,
                status: trip.status,
                candidateDriverIds
            });
        });
        socket.on("cancel_ride", async (payload) => {
            const trip = await trips_service_1.tripsService.cancelRide(userId, payload.tripId);
            io.to(`user:${userId}`).emit("ride_cancelled", { tripId: trip.id });
            if (trip.driverId) {
                io.to(`driver:${trip.driverId}`).emit("ride_cancelled", { tripId: trip.id });
            }
        });
        socket.on("accept_ride", async (payload) => {
            const trip = await trips_service_1.tripsService.acceptRide(userId, payload.tripId);
            const candidates = await trips_service_1.tripsService.getAndClearCandidateDrivers(trip.id);
            io.to(`user:${trip.riderId}`).emit("driver_matched", {
                tripId: trip.id,
                driverId: trip.driverId
            });
            for (const candidateDriverId of candidates) {
                if (candidateDriverId !== trip.driverId) {
                    io.to(`driver:${candidateDriverId}`).emit("ride_cancelled", { tripId: trip.id });
                }
            }
            io.to(`driver:${trip.driverId}`).emit("trip_status_update", {
                tripId: trip.id,
                status: "ASSIGNED"
            });
        });
        socket.on("reject_ride", async (payload) => {
            const trip = await trips_service_1.tripsService.getTripById(payload.tripId);
            if (trip) {
                io.to(`user:${trip.riderId}`).emit("trip_status_update", {
                    tripId: payload.tripId,
                    status: "DRIVER_REJECTED"
                });
            }
        });
        socket.on("trip_started", async (payload) => {
            const result = await trips_service_1.tripsService.startTrip(userId, payload.tripId);
            if (result.count) {
                const trip = await trips_service_1.tripsService.getTripById(payload.tripId);
                if (trip) {
                    io.to(`user:${trip.riderId}`).emit("trip_started", { tripId: trip.id });
                }
            }
        });
        socket.on("trip_completed", async (payload) => {
            const trip = await trips_service_1.tripsService.completeTrip(userId, payload.tripId, payload.price);
            io.to(`user:${trip.riderId}`).emit("trip_completed", {
                tripId: trip.id,
                price: trip.price
            });
        });
    });
    return io;
};
exports.initSockets = initSockets;
