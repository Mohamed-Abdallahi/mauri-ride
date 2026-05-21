import { Request, Response } from "express";
import { authService } from "./auth.service";

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body);
    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  },

  async login(req: Request, res: Response) {
    const data = await authService.login(req.body);
    return res.status(200).json(data);
  },

  async refresh(req: Request, res: Response) {
    const data = await authService.refresh(req.body.refreshToken);
    return res.status(200).json(data);
  }
};
