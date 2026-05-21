import { Request, Response } from "express";
import { ridersService } from "./riders.service";

export const ridersController = {
  async listMyTrips(req: Request, res: Response) {
    const limit = Number(req.query.limit ?? 20);
    const trips = await ridersService.listMyTrips(req.auth!.userId, limit);
    return res.status(200).json(trips);
  }
};
