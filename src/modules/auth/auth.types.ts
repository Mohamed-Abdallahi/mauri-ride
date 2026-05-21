export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  role: "RIDER" | "DRIVER";
  vehicleInfo?: Record<string, unknown>;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type RefreshBody = {
  refreshToken: string;
};
