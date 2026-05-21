"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driversController = void 0;
const drivers_service_1 = require("./drivers.service");
exports.driversController = {
    async goOnline(req, res) {
        const data = await drivers_service_1.driversService.goOnline(req.auth.userId);
        return res.status(200).json(data);
    },
    async goOffline(req, res) {
        const data = await drivers_service_1.driversService.goOffline(req.auth.userId);
        return res.status(200).json(data);
    },
    async updateLocation(req, res) {
        const data = await drivers_service_1.driversService.updateLocation(req.auth.userId, req.body.lat, req.body.lng);
        return res.status(200).json(data);
    }
};
