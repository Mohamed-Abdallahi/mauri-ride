import { redis } from "./redis";

const DRIVER_GEO_KEY = "drivers:geo";

export type Coordinates = {
  lat: number;
  lng: number;
};

export const locationService = {
  async setDriverLocation(driverId: string, coords: Coordinates) {
    await redis.geoadd(DRIVER_GEO_KEY, coords.lng, coords.lat, driverId);
    await redis.set(
      `driver:location:${driverId}`,
      JSON.stringify(coords),
      "EX",
      1800
    );
  },

  async removeDriverLocation(driverId: string) {
    await redis.zrem(DRIVER_GEO_KEY, driverId);
    await redis.del(`driver:location:${driverId}`);
  },

  async findNearbyDrivers(coords: Coordinates, radiusKm: number, limit = 20) {
    const raw = (await redis.call(
      "GEOSEARCH",
      DRIVER_GEO_KEY,
      "FROMLONLAT",
      coords.lng,
      coords.lat,
      "BYRADIUS",
      radiusKm,
      "km",
      "ASC",
      "COUNT",
      limit
    )) as string[];

    return raw;
  }
};
