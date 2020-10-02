import express from "express";
import { validationResult } from "express-validator";
export * from "express-validator";
export { express };

export const validateRequest: express.RequestHandler = async function (
  ...[req, , next]
) {
  const result = validationResult(req);

  try {
    const errors = result.array({ onlyFirstError: false });

    if (errors.length > 0) {
      const message = errors.map((e) => `${e.param}: ${e.msg}`).join("\n");
      const error: any = new Error(message);
      error["status"] = 400;
      throw error;
    }

    next();
  } catch (e) {
    next(e);
  }
};
