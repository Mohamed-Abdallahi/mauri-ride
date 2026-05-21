import { Request, Response } from "express";
import { earningsService } from "./earnings.service";

export const earningsController = {
  async listMine(req: Request, res: Response) {
    const limit = Number(req.query.limit ?? 20);
    const data = await earningsService.listForDriver(req.auth!.userId, limit);
    return res.status(200).json(data);
  }
};
