import { Router, Request, Response } from "express";
import { Database } from "../utils/Database";
import { Terminal } from "../utils/Terminal";
import { User } from "../types/Schema-Type";
import { ObjectId } from "mongodb";

const userRouter = Router();

/**
 * POST /user
 * Create user metadata to database
 */
userRouter.post("/", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || username.length < 6) {
    res.status(400).json({ success: false, error: "Username must be at least 6 characters" });
    return;
  }
  if (!email) {
    res.status(400).json({ success: false, error: "Email is required" });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const res_ = await Database.user.addOne({
      ...req.body,
      createAt: Date.now().toString(),
    });

    const success = res_?.insertedId;

    if (!success) throw new Error("Error on creating user metadata");

    res.status(200).json({ success: true });
  } catch (error: { message: string } | any) {
    Terminal.error(req.path, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /user/id/:id
 * Get user metadata from database by ObjectId
 */
userRouter.get("/id/:id", async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const user = (await Database.user.findId(id)) as Partial<User> | undefined;

    if (!user) {
      res.status(404).json({});
      return;
    }

    delete user.password;

    res.status(200).json(user);
  } catch (error: { message: string } | any) {
    Terminal.error(req.path, error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /user/:username
 * Search users by username (partial match)
 */
userRouter.get("/:username", async (req: Request, res: Response) => {
  const username = req.params["username"] as string;

  try {
    const users = (await Database.user.findUsername(username)) as
      | Partial<User>[]
      | undefined;

    if (!users || users.length < 1) {
      res.status(404).json([]);
      return;
    }

    users.forEach((e) => delete e?.password);

    res.status(200).json(users);
  } catch (error: { message: string } | any) {
    Terminal.error(req.path, error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /user/:id
 * Soft-delete user from database
 */
userRouter.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const user = (await Database.db.findOneAndUpdate(
      "users",
      { _id: new ObjectId(id) } as Pick<User, "_id">,
      { deleted: true } as Partial<User>,
    )) as Partial<User> | undefined;

    if (!user) {
      res.status(404).json({});
      return;
    }

    delete user.password;

    res.status(200).json(user);
  } catch (error: { message: string } | any) {
    Terminal.error(req.path, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /user/:id
 * Update user data
 */
userRouter.patch("/:id", async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { displayName, avatarUrl, password } = req.body;
  const model = { displayName, avatarUrl, password, _id: id };

  try {
    const user = await Database.user.findOneAndupdate(model);

    res.status(200).json({ success: true, user });
  } catch (error: { message: string } | any) {
    Terminal.error(error);
    res.status(400).json({ success: false, error });
  }
});

export default userRouter;
