import { Request, Response } from "express";
import { usersService } from "./users.service";

export const usersController = {
  async me(req: Request, res: Response) {
    const me = await usersService.getMe(req.auth!.userId);
    return res.status(200).json(me);
  },

  async list(req: Request, res: Response) {
    const role = req.query.role as "RIDER" | "DRIVER" | "ADMIN" | undefined;
    const users = await usersService.listUsers(role);
    return res.status(200).json(users);
  }
};
