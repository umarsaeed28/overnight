import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  LOCKOUT_MINUTES,
  MAX_FAILED_LOGINS,
  RESET_TOKEN_TTL_HOURS,
} from "../lib/rules";
import { loginSchema, passwordSchema, signupSchema, emailSchema } from "../lib/validation";
import { sendPasswordResetEmail } from "../lib/mailer";

const router = Router();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, digest] = stored.split(":");
  const candidate = scryptSync(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(digest, "hex"));
}

router.post("/auth/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return res.status(409).json({ error: "That email is already registered" });
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: hashPassword(parsed.data.password),
    },
  });

  req.session.userId = user.id;
  return res.status(201).json({ id: user.id, email: user.email });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return res.status(401).json({ error: "Email or password is incorrect" });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ error: "Account locked. Try again later." });
  }

  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    const failedLoginCount = user.failedLoginCount + 1;
    const locked = failedLoginCount >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount,
        lockedUntil: locked ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      },
    });
    return res.status(401).json({ error: "Email or password is incorrect" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  req.session.userId = user.id;
  return res.json({ id: user.id, email: user.email });
});

router.post("/auth/logout", async (req, res) => {
  req.session.destroy();
  return res.status(204).end();
});

router.get("/session", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not signed in" });

  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) return res.status(401).json({ error: "Not signed in" });

  return res.json({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
});

router.post("/auth/forgot-password", async (req, res) => {
  const parsed = emailSchema.safeParse(req.body?.email);
  // Always answer the same way, so the endpoint cannot be used to discover
  // which email addresses have accounts.
  if (!parsed.success) return res.status(202).json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 3600_000);
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });
    await sendPasswordResetEmail(user.email, token);
  }

  return res.status(202).json({ ok: true });
});

router.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body ?? {};
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
    return res.status(400).json({ error: "That reset link has expired. Request a new one." });
  }

  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash: hashPassword(parsed.data), failedLoginCount: 0, lockedUntil: null },
  });
  await prisma.passwordReset.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return res.json({ ok: true });
});

export default router;
