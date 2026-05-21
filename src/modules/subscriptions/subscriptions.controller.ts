import { Request, Response } from "express";
import { subscriptionsService } from "./subscriptions.service";

export const subscriptionsController = {
  async createOrRenew(req: Request, res: Response) {
    const sub = await subscriptionsService.createOrRenewForUser(
      req.auth!.userId,
      req.body.paymentReference,
      req.body.months
    );

    return res.status(201).json(sub);
  }
};
