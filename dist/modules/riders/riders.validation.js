"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riderTripsSchema = void 0;
const zod_1 = require("zod");
exports.riderTripsSchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.coerce.number().int().positive().max(100).optional()
    })
});
