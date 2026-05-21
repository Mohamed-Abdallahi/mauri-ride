export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "RIDER" | "DRIVER" | "ADMIN";
};
