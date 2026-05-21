"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsController = void 0;
const subscriptions_service_1 = require("./subscriptions.service");
exports.subscriptionsController = {
    async createOrRenew(req, res) {
        const sub = await subscriptions_service_1.subscriptionsService.createOrRenewForUser(req.auth.userId, req.body.paymentReference, req.body.months);
        return res.status(201).json(sub);
    }
};
