import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

import { requireAuth, generateToken, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: "Username, email, and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ username, email, passwordHash }).returning();
    const token = generateToken(user.id);

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/logout
router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, username: user.username, email: user.email, isPremium: user.isPremium, planType: user.planType, createdAt: user.createdAt });
  } catch (err) {
    logger.error({ err }, "GetMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/upgrade
router.post("/auth/upgrade", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { planType } = req.body;
    if (!planType) {
      res.status(400).json({ error: "planType is required" });
      return;
    }
    const [user] = await db.update(usersTable)
      .set({ isPremium: true, planType, planActivatedAt: new Date() })
      .where(eq(usersTable.id, req.userId!))
      .returning();
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({
      message: "Plan upgraded successfully!",
      user: { id: user.id, username: user.username, email: user.email, isPremium: user.isPremium, planType: user.planType, createdAt: user.createdAt },
    });
  } catch (err) {
    logger.error({ err }, "Upgrade error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(404).json({ error: "No account found with that email address" });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await db.update(usersTable)
      .set({ resetToken, resetTokenExpiry })
      .where(eq(usersTable.id, user.id));

    const resetLink = `/reset-password?token=${resetToken}`;

    res.json({
      message: "Password reset token generated. In production, this would be sent to your email.",
      resetToken,
      resetLink,
    });
  } catch (err) {
    logger.error({ err }, "ForgotPassword error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token)).limit(1);
    if (!user || !user.resetTokenExpiry) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    if (new Date() > user.resetTokenExpiry) {
      res.status(400).json({ error: "Reset token has expired. Please request a new one." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
      .where(eq(usersTable.id, user.id));

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "ResetPassword error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
