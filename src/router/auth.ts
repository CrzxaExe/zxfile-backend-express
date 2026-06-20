import { Router, Request, Response } from "express";
import { Database } from "../utils/Database";
import { Terminal } from "../utils/Terminal";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const authRouter = Router();

/**
 * POST /auth/register
 * Registering new account
 * @deprecated
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: "Missing username, email, or password" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const exist = await Database.db.findMany("users", { email, username });

    if (exist && exist.length > 0) {
      res.status(302).json({ error: "Username or email already exist" });
      return;
    }

    await Database.user.addOne({
      createAt: new Date().toString(),
      password,
      email,
      username,
    });

    res.status(200).json({ success: true });
  } catch (err: Error | any) {
    Terminal.error("Registration error", err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  try {
    const exist = await Database.db.findOne("users", { email });

    if (!exist) {
      res.status(404).json({ error: "Email not found" });
      return;
    }

    const isVerify = await bcrypt.compare(password, exist.password);

    if (!isVerify) {
      res.status(406).json({ error: "Password dont match" });
      return;
    }

    const token = jwt.sign(
      {
        username: exist.username,
        email: exist.email,
        displayName: exist.displayName,
      },
      process.env.JWT_SECRET || "here",
      { expiresIn: "1d" },
    );

    res.cookie("auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      partitioned: true,
      maxAge: 60 * 60 * 24 * 1000, // 1 day in ms
    });

    res.status(200).json({ success: true });
  } catch (error: Error | any) {
    Terminal.error("Login error", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /auth/logout
 * Logout
 */
authRouter.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    res.clearCookie("auth");
  } catch (error: Error | any) {
    Terminal.error("Logout Error", error);
    res.status(400).json({ error: error.message });
  }
});

export default authRouter;
