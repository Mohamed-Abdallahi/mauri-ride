"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEarningsSchema = void 0;
const zod_1 = require("zod");
exports.listEarningsSchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.coerce.number().int().positive().max(100).optional()
    })
});
