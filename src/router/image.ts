import { Router, Request, Response } from "express";
import { Database } from "../utils/Database";
import { Terminal } from "../utils/Terminal";
import { Image } from "../types/Schema-Type";
import { Generator } from "../utils/Generator";
import { ObjectId } from "mongodb";
import { GDrive } from "../services/GDrive";

const imageRouter = Router();

/**
 * GET /q/:id
 * Stream image binary directly from Google Drive.
 * The frontend can use this as an <img> src directly: <img src="/q/someImageId" />
 *
 * Query params:
 *   ?original=true  → stream the original (non-optimized) version
 *   (default)       → stream the optimized WebP version
 */
imageRouter.get("/q/:id", async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const useOriginal = req.query["original"] === "true";

  try {
    // 1. Look up image metadata from database using public imageId
    const image = (await Database.db.findOne("images", {
      imageId: id,
    } as Pick<Image, "imageId">)) as Partial<Image> | undefined;

    if (!image || image.deleted) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    // 2. Pick which Drive file to serve
    const fileId = useOriginal
      ? image.imageDriveId!
      : image.optimizedImageDriveId!;

    // 3. Get file metadata to determine Content-Type
    const meta = await GDrive.read(fileId);
    const mimeType = useOriginal
      ? (meta.data.mimeType ?? image.context?.mimetype ?? "image/jpeg")
      : "image/webp"; // optimized is always WebP

    // 4. Set response headers
    res.setHeader("Content-Type", mimeType);
    // Cache for 7 days in browser, 30 days on CDN
    res.setHeader(
      "Cache-Control",
      "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
    );

    // 5. Stream image binary from Google Drive → pipe to response
    const driveStream = await GDrive.stream(fileId);
    driveStream.data.pipe(res);

    // Handle upstream errors (e.g., Drive API error mid-stream)
    driveStream.data.on("error", (err: Error) => {
      Terminal.error("GDrive stream error", err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: "Failed to stream image from Drive" });
      }
    });
  } catch (error: Error | any) {
    Terminal.error("Image stream error", error.message);
    if (!res.headersSent) {
      res.status(400).json({ error: error.message });
    }
  }
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
 * Delete image metadata from database by public imageId
 * Soft delete: sets deleted=true and records deleteAt timestamp
 */
imageRouter.delete("/image/delete/:id", async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const image = (await Database.db.findOne("images", {
      imageId: id,
    } as Pick<Image, "imageId">)) as Partial<Image> | undefined;

    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    // Soft delete: mark as deleted with timestamp
    const result = await Database.db.findOneAndUpdate(
      "images",
      { imageId: id } as Pick<Image, "imageId">,
      {
        deleted: true,
        deleteAt: new Date().toISOString(),
      } as Partial<Image>,
    );

    if (!result) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    res.status(200).json({ success: true, imageId: id });
  } catch (error: Error | any) {
    Terminal.error("Image delete error", error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /image/update/:id
 * Update image metadata (title, context) by public imageId
 */
imageRouter.patch("/image/update/:id", async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { title, context } = req.body as Partial<Pick<Image, "title" | "context">>;

  if (!title && !context) {
    res.status(400).json({ error: "No fields to update provided" });
    return;
  }

  try {
    const existing = (await Database.db.findOne("images", {
      imageId: id,
    } as Pick<Image, "imageId">)) as Partial<Image> | undefined;

    if (!existing || existing.deleted) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    // Build update payload — only include provided fields
    const updatePayload: Partial<Image> = {};
    if (title) updatePayload.title = title;
    if (context) {
      // Validate context fields if provided
      if (context.author !== undefined) {
        // Verify author exists
        const author = await Database.db.findOne("users", {
          username: context.author,
        });
        if (!author) {
          res.status(404).json({ error: "Author username not found" });
          return;
        }
        updatePayload.context = {
          ...existing.context,
          ...context,
        } as Image["context"];
      } else {
        updatePayload.context = {
          ...existing.context,
          ...context,
        } as Image["context"];
      }
    }

    const result = await Database.db.findOneAndUpdate(
      "images",
      { imageId: id } as Pick<Image, "imageId">,
      updatePayload,
    );

    if (!result) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    // Return updated image data
    const updated = await Database.db.findOne("images", {
      _id: result._id,
    } as Pick<Image, "_id">);

    res.status(200).json({ success: true, image: updated });
  } catch (error: Error | any) {
    Terminal.error("Image update error", error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /image/user/:username
 * Get all images by author username
 */
imageRouter.get("/image/user/:username", async (req: Request, res: Response) => {
  const username = req.params["username"] as string;

  try {
    const author = await Database.db.findOne("users", { username });

    if (!author) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const images = await Database.db.findMany(
      "images",
      {
        "context.author": username,
      } as any,
      {},
      false, // exact match, not regex (nested field)
    );

    if (!images || images.length < 1) {
      res.status(404).json([]);
      return;
    }

    res.status(200).json(images);
  } catch (error: Error | any) {
    Terminal.error("Image list error", error.message);
    res.status(400).json({ error: error.message });
  }
});

export default imageRouter;
