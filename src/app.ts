import express from "express";
import cors from "cors";
import { appRoutes } from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).json({
		name: "mauri-ride-backend",
		status: "ok",
		apiBase: "/api"
	});
});

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use("/api", appRoutes);
app.use(errorMiddleware);
