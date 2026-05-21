"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationService = void 0;
const redis_1 = require("./redis");
const DRIVER_GEO_KEY = "drivers:geo";
exports.locationService = {
    async setDriverLocation(driverId, coords) {
        await redis_1.redis.geoadd(DRIVER_GEO_KEY, coords.lng, coords.lat, driverId);
        await redis_1.redis.set(`driver:location:${driverId}`, JSON.stringify(coords), "EX", 1800);
    },
    async removeDriverLocation(driverId) {
        await redis_1.redis.zrem(DRIVER_GEO_KEY, driverId);
        await redis_1.redis.del(`driver:location:${driverId}`);
    },
    async findNearbyDrivers(coords, radiusKm, limit = 20) {
        const raw = (await redis_1.redis.call("GEOSEARCH", DRIVER_GEO_KEY, "FROMLONLAT", coords.lng, coords.lat, "BYRADIUS", radiusKm, "km", "ASC", "COUNT", limit));
        return raw;
    }
};
