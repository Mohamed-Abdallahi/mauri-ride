import { Request, Response } from "express";
import { driversService } from "./drivers.service";

export const driversController = {
  async goOnline(req: Request, res: Response) {
    const data = await driversService.goOnline(req.auth!.userId);
    return res.status(200).json(data);
  },

  async goOffline(req: Request, res: Response) {
    const data = await driversService.goOffline(req.auth!.userId);
    return res.status(200).json(data);
  },

  async updateLocation(req: Request, res: Response) {
    const data = await driversService.updateLocation(
      req.auth!.userId,
      req.body.lat,
      req.body.lng
    );
    return res.status(200).json(data);
  }
};
