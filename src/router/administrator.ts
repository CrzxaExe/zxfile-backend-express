import { Request, Response, Router } from "express";
import { Terminal } from "../utils/Terminal";
import { Database } from "../utils/Database";
import { GDrive } from "../services/GDrive";
import { WithId } from "mongodb";
import { Image, User } from "../types/Schema-Type";

const adminRoute = Router();
const adminKey = process.env.ADMIN_KEY;

adminRoute.delete("/image/delete/:key", async (req: Request, res: Response) => {
  const { key } = req.params;
  if (!adminKey) {
    res.status(444).json({ error: "No Response" });
    return;
  }

  if (key !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
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

adminRoute.patch("/users/update/:key", async(req: Request, res: Response) => {
  const { key } = req.params;
  if (!adminKey) {
    res.status(444).json({ error: "No Response" });
    return;
  }

  if (key !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return
  }

  if (!req.body.username) {
    res.status(404).json({ error: "No username provided" });
    return;
  }
  
  const model = { ...req.body };

  try {
    const user: Partial<WithId<User>> | undefined | null =
      await Database.user.findOneAndupdate(model);

    if (!user) throw new Error("User cant be updated");
    delete user?.password;
    delete user?.createAt;

    res.status(200).json({ success: true, user });
  } catch (error: { message: string } | any) {
    Terminal.error(error);
    res.status(400).json({ success: false, error });
  }
})

adminRoute.post("/update/image/author/:key", async(req: Request, res: Response) => {
  const { key } = req.params;
  if (!adminKey) {
    res.status(444).json({ error: "No Response" });
    return;
  }

  if (key !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {    
    const users = await Database.user.getAll(["username","displayName","_id"]);
    const images = (await Database.db.getAll("images", ["context","imageId"]) as WithId<Image>[])
      .map(item => {
        const user = users?.find(e => e.username === item.context.author);
        item.context.authorUsername = item.context.author;
        item.context.author = user?.displayName ?? item.context.author;

        return item;
      });

    images.forEach(async item => Database.db.findOneAndUpdate("images", { imageId: item.imageId }, { context: item.context }));
  
    res.status(200).json({ success: true, images });
  } catch (error: { message: string } | any) {
    Terminal.error(error.message);
    res.status(400).json({ success: false });
  }
})

adminRoute.post("/update/user/:key", async(req: Request, res: Response) => {
  const { key } = req.params;
  if (!adminKey) {
    res.status(444).json({ error: "No Response" });
    return;
  }

  if (key !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await Database.db.updateMany("users", {}, { $unset: { confirmPassword: 1 } });
  } catch (error: { message: string } | any) {
    Terminal.error(error.message);
    res.status(400).json({ success: false });
  }
})

export default adminRoute;
