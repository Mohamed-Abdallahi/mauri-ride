"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ridersController = void 0;
const riders_service_1 = require("./riders.service");
exports.ridersController = {
    async listMyTrips(req, res) {
        const limit = Number(req.query.limit ?? 20);
        const trips = await riders_service_1.ridersService.listMyTrips(req.auth.userId, limit);
        return res.status(200).json(trips);
    }
};
