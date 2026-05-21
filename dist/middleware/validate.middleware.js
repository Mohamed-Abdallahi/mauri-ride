"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const api_error_1 = require("../utils/api-error");
const validate = (schema) => {
    return (req, _res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query
        });
        if (!result.success) {
            return next(new api_error_1.ApiError(400, result.error.issues.map((issue) => issue.message).join(", ")));
        }
        return next();
    };
};
exports.validate = validate;
