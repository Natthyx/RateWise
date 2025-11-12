import { Request, Response, NextFunction } from "express";

// Wrapper function to handle async middleware
export const asyncMiddleware = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};