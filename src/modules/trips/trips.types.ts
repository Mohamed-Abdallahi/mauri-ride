export type Coordinates = {
  lat: number;
  lng: number;
};

export type RequestRideBody = {
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
};

export type CompleteTripBody = {
  price: number;
};
