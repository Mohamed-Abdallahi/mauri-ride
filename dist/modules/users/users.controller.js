"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const users_service_1 = require("./users.service");
exports.usersController = {
    async me(req, res) {
        const me = await users_service_1.usersService.getMe(req.auth.userId);
        return res.status(200).json(me);
    },
    async list(req, res) {
        const role = req.query.role;
        const users = await users_service_1.usersService.listUsers(role);
        return res.status(200).json(users);
    }
};
