import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireUser } from "../lib/auth-middleware";
import { shippingFor } from "../lib/rules";
import { guestCheckoutSchema } from "../lib/validation";
import { chargeCard } from "../lib/payments";

const router = Router();

/**
 * Guest checkout. No account is created; the order is keyed to the email only.
 */
router.post("/orders", async (req, res) => {
  const parsed = guestCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const token = req.cookies.cart_token;
  const cart = token
    ? await prisma.cart.findUnique({
        where: { token },
        include: { items: { include: { product: true } } },
      })
    : null;

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty" });
  }

  const subtotalCents = cart.items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );
  const shippingCents = shippingFor(subtotalCents);

  const order = await prisma.order.create({
    data: {
      userId: req.session.userId ?? null,
      guestEmail: req.session.userId ? null : parsed.data.email,
      status: "PENDING_PAYMENT",
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      shippingName: parsed.data.shipping.name,
      shippingLine1: parsed.data.shipping.line1,
      shippingCity: parsed.data.shipping.city,
      shippingPost: parsed.data.shipping.postcode,
      phone: parsed.data.shipping.phone ?? null,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceCents: item.product.priceCents,
        })),
      },
    },
    include: { items: true },
  });

  return res.status(201).json(order);
});

router.post("/orders/:id/pay", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "PENDING_PAYMENT") {
    return res.status(409).json({ error: "That order has already been paid" });
  }

  const result = await chargeCard({
    amountCents: order.totalCents,
    token: req.body?.paymentToken,
  });

  if (!result.ok) {
    return res.status(402).json({ error: "Payment was declined" });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
  await prisma.cartItem.deleteMany({ where: { cart: { userId: order.userId } } });

  return res.json({ ok: true, status: "PAID" });
});

router.get("/orders", requireUser, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.session.userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });
  return res.json({ orders });
});

router.get("/orders/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });

  // A signed-in shopper sees only their own orders. Guest orders are not
  // readable after checkout at all.
  if (order.userId && order.userId !== req.session.userId) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.json(order);
});

export default router;
