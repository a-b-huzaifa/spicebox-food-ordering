import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export interface ValidationTargets {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Reusable Zod validation middleware.
 * Accepts either a single schema (validated against req.body)
 * or an object targeting body, query, and/or params.
 */
export function validate(schema: ZodTypeAny | ValidationTargets): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schema || 'parse' in schema) {
        req.body = await (schema as ZodTypeAny).parseAsync(req.body);
      } else {
        const targets = schema as ValidationTargets;
        if (targets.body) {
          req.body = await targets.body.parseAsync(req.body);
        }
        if (targets.query) {
          req.query = (await targets.query.parseAsync(req.query)) as Request['query'];
        }
        if (targets.params) {
          req.params = (await targets.params.parseAsync(req.params)) as Request['params'];
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default validate;
