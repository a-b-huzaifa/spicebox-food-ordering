import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Generic wrapper: lets route handlers be `async` and forwards any rejected
// promise to Express's error middleware. The type parameters let a route
// declare a narrower Request (e.g. AuthRequest) without casting at the call site.
export function asyncHandler<Req extends Request = Request, Res extends Response = Response>(
  handler: (req: Req, res: Res, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as Req, res as Res, next)).catch(next);
  };
}
