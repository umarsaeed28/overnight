import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../lib/auth-middleware";
import { updateProductSchema } from "../lib/validation";

const router = Router();

const PAGE_SIZE = 24;

router.get("/products", async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const search = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return res.json({ products, page, pageSize: PAGE_SIZE });
});

router.get("/products/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product || !product.isActive) {
    return res.status(404).json({ error: "Product not found" });
  }
  return res.json(product);
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  return res.json(product);
});

export default router;
