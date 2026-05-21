import { z } from "zod";

const coordinates = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export const requestRideSchema = z.object({
  body: z.object({
    pickupLocation: coordinates,
    dropoffLocation: coordinates
  })
});

export const completeTripSchema = z.object({
  body: z.object({
    price: z.number().positive()
  })
});
