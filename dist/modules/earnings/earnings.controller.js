"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.earningsController = void 0;
const earnings_service_1 = require("./earnings.service");
exports.earningsController = {
    async listMine(req, res) {
        const limit = Number(req.query.limit ?? 20);
        const data = await earnings_service_1.earningsService.listForDriver(req.auth.userId, limit);
        return res.status(200).json(data);
    }
};
