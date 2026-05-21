"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./routes");
const error_middleware_1 = require("./middleware/error.middleware");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.get("/", (_req, res) => {
    res.status(200).json({
        name: "mauri-ride-backend",
        status: "ok",
        apiBase: "/api"
    });
});
exports.app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
exports.app.use("/api", routes_1.appRoutes);
exports.app.use(error_middleware_1.errorMiddleware);
