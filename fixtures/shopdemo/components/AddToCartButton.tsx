"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({
  productId,
  maxQuantity,
}: {
  productId: string;
  maxQuantity: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function addToCart() {
    setError(null);

    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });

    if (response.status === 409) {
      setError("Not enough stock");
      return;
    }
    if (!response.ok) {
      setError("Could not add that to your cart");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <label htmlFor="quantity">Quantity</label>
      <input
        id="quantity"
        type="number"
        min={1}
        max={maxQuantity}
        value={quantity}
        onChange={(event) => setQuantity(Number(event.target.value))}
      />
      <button type="button" onClick={addToCart} data-testid="add-to-cart">
        Add to cart
      </button>
      {error ? <p data-testid="cart-error">{error}</p> : null}
    </div>
  );
}
