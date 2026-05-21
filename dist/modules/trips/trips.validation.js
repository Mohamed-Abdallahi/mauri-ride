"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTripSchema = exports.requestRideSchema = void 0;
const zod_1 = require("zod");
const coordinates = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180)
});
exports.requestRideSchema = zod_1.z.object({
    body: zod_1.z.object({
        pickupLocation: coordinates,
        dropoffLocation: coordinates
    })
});
exports.completeTripSchema = zod_1.z.object({
    body: zod_1.z.object({
        price: zod_1.z.number().positive()
    })
});
