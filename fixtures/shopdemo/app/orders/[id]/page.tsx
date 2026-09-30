import { notFound } from "next/navigation";
import { formatPrice } from "../../../lib/format";
import type { Order } from "../../../lib/types";

const API_URL = process.env.API_URL ?? "http://localhost:4001";

async function fetchOrder(id: string): Promise<Order | null> {
  const response = await fetch(`${API_URL}/api/orders/${id}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET /orders/${id} failed`);
  return (await response.json()) as Order;
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await fetchOrder(params.id);
  if (!order) notFound();

  return (
    <main>
      <h1>Order {order.id.slice(0, 8)}</h1>
      <p data-testid="order-confirmation">{order.status}</p>

      <ul>
        {order.items.map((item) => (
          <li key={item.id}>
            {item.product.name} × {item.quantity} — {formatPrice(item.priceCents * item.quantity)}
          </li>
        ))}
      </ul>

      <dl>
        <dt>Subtotal</dt>
        <dd>{formatPrice(order.subtotalCents)}</dd>
        <dt>Shipping</dt>
        <dd>{formatPrice(order.shippingCents)}</dd>
        <dt>Total</dt>
        <dd data-testid="order-total">{formatPrice(order.totalCents)}</dd>
      </dl>
    </main>
  );
}
