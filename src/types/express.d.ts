declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: "RIDER" | "DRIVER" | "ADMIN";
      };
    }
  }
}

export {};
