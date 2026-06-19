import { Router, Request, Response } from "express";
import { Editor } from "../services/Editor";
import { GDrive } from "../services/GDrive";
import { drive_v3 } from "googleapis";
import multer from "multer";
import authentication from "../middleware/authentication";

const driveRouter = Router();

// Use memory storage so files are available as buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Apply JWT authentication guard to all /drive routes
driveRouter.use(authentication);

/**
 * POST /drive/upload
 * Upload image(s) to Google Drive
 */
driveRouter.post(
  "/upload",
  upload.array("files"),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const uploaded: {
      original: drive_v3.Schema$File;
      optimized: drive_v3.Schema$File;
    }[] = [];

    try {
      for (const file of files) {
        const buffer = file.buffer;
        const optimize = await Editor.optimized(buffer);

        const original = await GDrive.upload(
          buffer,
          file.mimetype,
          "." + file.originalname.split(".").pop()!,
        );
        const optimized = await GDrive.upload(optimize, "image/webp", ".webp");

        uploaded.push({
          original: original.data,
          optimized: optimized.data,
        });
      }

      res.status(201).json({ files: uploaded });
    } catch (error: Error | any) {
      res.status(400).json({ error: error.message });
    }
  },
);

/**
 * DELETE /drive/delete/:id
 * Delete image by GDrive file ID
 */
driveRouter.delete("/delete/:id", async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    if (!id) throw new Error("Missing id");

    const result = await GDrive.delete(id);

    res.status(200).json({ success: result.status === 204 });
  } catch (error: Error | any) {
    res.status(400).json({ error: error.message });
  }
});

export default driveRouter;
