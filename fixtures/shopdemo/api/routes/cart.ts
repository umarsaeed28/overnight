import { randomUUID } from "node:crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { CART_TTL_DAYS, MAX_QUANTITY_PER_LINE } from "../lib/rules";
import { addToCartSchema } from "../lib/validation";

const router = Router();

async function loadOrCreateCart(token: string | undefined, userId: string | undefined) {
  if (token) {
    const existing = await prisma.cart.findUnique({
      where: { token },
      include: { items: { include: { product: true } } },
    });
    if (existing && existing.expiresAt > new Date()) return existing;
  }

  return prisma.cart.create({
    data: {
      token: randomUUID(),
      userId,
      expiresAt: new Date(Date.now() + CART_TTL_DAYS * 86_400_000),
    },
    include: { items: { include: { product: true } } },
  });
}

router.get("/cart", async (req, res) => {
  const cart = await loadOrCreateCart(req.cookies.cart_token, req.session.userId);
  res.cookie("cart_token", cart.token, { httpOnly: true, sameSite: "lax" });
  return res.json(cart);
});

router.post("/cart/items", async (req, res) => {
  const parsed = addToCartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.isActive) {
    return res.status(404).json({ error: "Product not found" });
  }
  if (product.stock < parsed.data.quantity) {
    return res.status(409).json({ error: "Not enough stock" });
  }

  const cart = await loadOrCreateCart(req.cookies.cart_token, req.session.userId);
  const existing = cart.items.find((item) => item.productId === product.id);
  const quantity = Math.min(
    MAX_QUANTITY_PER_LINE,
    (existing?.quantity ?? 0) + parsed.data.quantity,
  );

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    create: { cartId: cart.id, productId: product.id, quantity },
    update: { quantity },
  });

  res.cookie("cart_token", cart.token, { httpOnly: true, sameSite: "lax" });
  return res.status(201).json({ ok: true });
});

router.delete("/cart/items/:productId", async (req, res) => {
  const token = req.cookies.cart_token;
  if (!token) return res.status(404).json({ error: "No cart" });

  const cart = await prisma.cart.findUnique({ where: { token } });
  if (!cart) return res.status(404).json({ error: "No cart" });

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId: req.params.productId },
  });

  return res.status(204).end();
});

export default router;
