"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "../lib/format";

export function PaymentForm({ totalCents }: { totalCents: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const created = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        shipping: {
          name: form.get("name"),
          line1: form.get("line1"),
          city: form.get("city"),
          postcode: form.get("postcode"),
          phone: form.get("phone") || undefined,
        },
      }),
    });

    if (!created.ok) {
      setPending(false);
      setError("We could not create your order. Check your details and try again.");
      return;
    }

    const order = (await created.json()) as { id: string };
    const paid = await fetch(`/api/orders/${order.id}/pay`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentToken: form.get("cardToken") }),
    });

    setPending(false);

    if (paid.status === 402) {
      setError("Payment was declined. Try a different card.");
      return;
    }

    router.push(`/orders/${order.id}`);
  }

  return (
    <form onSubmit={pay} data-testid="payment-form">
      <h2>Payment</h2>

      <label htmlFor="cardToken">Card</label>
      <input id="cardToken" name="cardToken" required data-testid="card-input" />

      {error ? <p role="alert" data-testid="payment-error">{error}</p> : null}

      <button type="submit" disabled={pending} data-testid="place-order">
        {pending ? "Placing order…" : `Pay ${formatPrice(totalCents)}`}
      </button>
    </form>
  );
}
