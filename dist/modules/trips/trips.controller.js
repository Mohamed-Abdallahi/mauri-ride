"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripsController = void 0;
const trips_service_1 = require("./trips.service");
const sockets_1 = require("../../sockets");
exports.tripsController = {
    async requestRide(req, res) {
        const data = await trips_service_1.tripsService.requestRide(req.auth.userId, req.body.pickupLocation, req.body.dropoffLocation);
        (0, sockets_1.emitRideRequested)({
            riderUserId: req.auth.userId,
            tripId: data.trip.id,
            pickupLocation: req.body.pickupLocation,
            dropoffLocation: req.body.dropoffLocation,
            status: data.trip.status,
            candidateDriverIds: data.candidateDriverIds
        });
        return res.status(201).json(data);
    },
    async cancelRide(req, res) {
        const tripId = String(req.params.tripId);
        const trip = await trips_service_1.tripsService.cancelRide(req.auth.userId, tripId);
        return res.status(200).json(trip);
    },
    async startTrip(req, res) {
        const tripId = String(req.params.tripId);
        const result = await trips_service_1.tripsService.startTrip(req.auth.userId, tripId);
        return res.status(200).json(result);
    },
    async completeTrip(req, res) {
        const tripId = String(req.params.tripId);
        const trip = await trips_service_1.tripsService.completeTrip(req.auth.userId, tripId, req.body.price);
        return res.status(200).json(trip);
    }
};
