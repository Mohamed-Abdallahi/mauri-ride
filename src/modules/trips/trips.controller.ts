import { Request, Response } from "express";
import { tripsService } from "./trips.service";
import { emitRideRequested } from "../../sockets";

export const tripsController = {
  async requestRide(req: Request, res: Response) {
    const data = await tripsService.requestRide(
      req.auth!.userId,
      req.body.pickupLocation,
      req.body.dropoffLocation
    );

    emitRideRequested({
      riderUserId: req.auth!.userId,
      tripId: data.trip.id,
      pickupLocation: req.body.pickupLocation,
      dropoffLocation: req.body.dropoffLocation,
      status: data.trip.status,
      candidateDriverIds: data.candidateDriverIds
    });

    return res.status(201).json(data);
  },

  async cancelRide(req: Request, res: Response) {
    const tripId = String(req.params.tripId);
    const trip = await tripsService.cancelRide(req.auth!.userId, tripId);
    return res.status(200).json(trip);
  },

  async startTrip(req: Request, res: Response) {
    const tripId = String(req.params.tripId);
    const result = await tripsService.startTrip(req.auth!.userId, tripId);
    return res.status(200).json(result);
  },

  async completeTrip(req: Request, res: Response) {
    const tripId = String(req.params.tripId);
    const trip = await tripsService.completeTrip(
      req.auth!.userId,
      tripId,
      req.body.price
    );
    return res.status(200).json(trip);
  }
};
