import { express } from "../express";

export function handleExpressError(fn: express.RequestHandler): typeof fn {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (e) {
      next(e);
    }
  };
}
