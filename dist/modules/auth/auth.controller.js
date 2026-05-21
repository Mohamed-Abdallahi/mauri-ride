"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
exports.authController = {
    async register(req, res) {
        const user = await auth_service_1.authService.register(req.body);
        return res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    },
    async login(req, res) {
        const data = await auth_service_1.authService.login(req.body);
        return res.status(200).json(data);
    },
    async refresh(req, res) {
        const data = await auth_service_1.authService.refresh(req.body.refreshToken);
        return res.status(200).json(data);
    }
};
