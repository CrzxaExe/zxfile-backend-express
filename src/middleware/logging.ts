import { Request, Response, NextFunction } from "express";
import { Terminal } from "../utils/Terminal";

/**
 * Express middleware for request logging
 */
const logger = (req: Request, _res: Response, next: NextFunction): void => {
  Terminal.log(req.method, req.url);
  next();
};

export default logger;
