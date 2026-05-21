"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionSchema = void 0;
const zod_1 = require("zod");
exports.createSubscriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentReference: zod_1.z.string().min(3),
        months: zod_1.z.number().int().positive().max(12).optional()
    })
});
