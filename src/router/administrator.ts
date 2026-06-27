import { Request, Response, Router } from "express";
import { Terminal } from "../utils/Terminal";
import { Database } from "../utils/Database";
import { GDrive } from "../services/GDrive";

const adminRoute = Router();

adminRoute.delete("/image/delete/:key", async (req: Request, res: Response) => {
  const { key } = req.params;
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    res.status(444).json({ error: "No Response" });
    return;
  }

  if (key !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await Database.db.findMany(
      "images",
      { deleted: true },
      {},
      false,
    );
    if (!result || result.length < 0) {
      res.status(200).json({ message: "There is no image has been deleted" });
      return;
    }

    const imagesID = result
      .map((e) => [e.imageDriveId, e.optimizedImageDriveId])
      .flat();

    result.forEach(
      async (e) => await Database.db.findOneAndDelete("images", { _id: e._id }),
    );
    imagesID.forEach(async (e) => await GDrive.delete(e));

    res.status(200).json({ message: "OK" });
  } catch (error: Error | any) {
    Terminal.error("Error admin delete image:", error.message);
    res.status(400).json({ error: error.message });
  }
});

export default adminRoute;
