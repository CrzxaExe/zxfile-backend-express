import { Router, Request, Response } from "express";
import logger from "../middleware/logging";
import authRouter from "./auth";
import imageRouter from "./image";
import driveRouter from "./drive";
import userRouter from "./user";

/**
 * Application route controller
 */
const router = Router();

// Apply request logger to all routes
router.use(logger);

// Root health check
router.get("/", (_req: Request, res: Response) => {
  res.json({ message: "test" });
});

// Auth routes
router.use("/auth", authRouter);

// Image routes
router.use("/", imageRouter);

// Drive routes (protected)
router.use("/drive", driveRouter);

// User routes
router.use("/user", userRouter);

export default router;
