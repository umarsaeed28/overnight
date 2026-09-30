import type { NextFunction, Request, Response } from "express";
import { prisma } from "./prisma";

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Sign in to continue" });
  }
  return next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Sign in to continue" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user?.isAdmin) {
    return res.status(403).json({ error: "Admins only" });
  }

  return next();
}
