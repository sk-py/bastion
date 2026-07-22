import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import BadRequestError from "../core/errors/bad-request.js";
import type { ValidationError } from "../types/validation.js";

type ValidationSource = "body" | "query" | "params";

export const validate =
  (schema: ZodType, source: ValidationSource) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      switch (source) {
        case "body":
          req.body = await schema.parseAsync(req.body);
          break;

        case "query":
          req.query = (await schema.parseAsync(req.query)) as Request["query"];
          break;

        case "params":
          req.params = (await schema.parseAsync(
            req.params,
          )) as Request["params"];
          break;
      }

      next();
    } catch (error) {
       if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map(
          (issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })
        );

        throw new BadRequestError(
          validationErrors
            .map((err) => `${err.field}: ${err.message}`)
            .join(', ')
        );
      }
      next(error);
      // console.log(error);
      
    }
  };
