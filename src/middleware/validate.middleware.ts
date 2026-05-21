import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import { ApiError } from "../utils/api-error";

export const validate = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return next(
        new ApiError(
          400,
          result.error.issues.map((issue) => issue.message).join(", ")
        )
      );
    }

    return next();
  };
};
