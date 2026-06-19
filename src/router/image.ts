import { Router, Request, Response } from "express";
import { Database } from "../utils/Database";
import { Terminal } from "../utils/Terminal";
import { Image } from "../types/Schema-Type";
import { Generator } from "../utils/Generator";

const imageRouter = Router();

/**
 * GET /q/:id
 * Get image metadata from database (stub)
 */
imageRouter.get("/q/:id", (_req: Request, res: Response) => {
  res.status(200).json({});
});

/**
 * POST /image/create
 * Create image metadata to database
 */
imageRouter.post("/image/create", async (req: Request, res: Response) => {
  const { context, imageId, optimizedImageId, title } = req.body;

  if (!title) {
    res.status(400).json({ error: "Missing image title" });
    return;
  }
  if (!imageId) {
    res.status(400).json({ error: "Original image id is missing" });
    return;
  }
  if (!optimizedImageId) {
    res.status(400).json({ error: "Optimized image id is missing" });
    return;
  }
  if (!context?.author) {
    res.status(400).json({ error: "Author username is missing" });
    return;
  }
  if (!context?.mimetype) {
    res.status(400).json({ error: "Image mimetype is missing" });
    return;
  }

  try {
    const author = await Database.db.findOne("users", {
      username: context.author,
    });

    if (!author) {
      res.status(404).json({ error: "Username not found" });
      return;
    }

    const result = await Database.db.addOne<Image>("images", {
      imageId: Generator.id(),
      createAt: new Date().toISOString(),
      imageDriveId: imageId,
      optimizedImageDriveId: optimizedImageId,
      context,
      title,
    });

    if (!result?.insertedId) throw new Error("Something went wrong");

    res.status(200).json(result);
  } catch (error: Error | any) {
    Terminal.error("Image create error", error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /image/delete/:id
 * Delete image metadata from database (stub)
 */
imageRouter.delete("/image/delete/:id", (_req: Request, res: Response) => {
  res.status(200).json({});
});

/**
 * PATCH /image/update/:id
 * Update image metadata from database (stub)
 */
imageRouter.patch("/image/update/:id", (_req: Request, res: Response) => {
  res.status(200).json({});
});

export default imageRouter;
