"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "../lib/types";

export function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        priceCents: Math.round(Number(form.get("price")) * 100),
        stock: Number(form.get("stock")),
        isActive: form.get("isActive") === "on",
      }),
    });

    if (response.status === 403) {
      setError("Admins only");
      return;
    }
    if (!response.ok) {
      setError("Could not save that product");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} data-testid="product-edit-form">
      <label htmlFor="name">Name</label>
      <input id="name" name="name" defaultValue={product.name} required />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" defaultValue={product.description} />

      <label htmlFor="price">Price</label>
      <input
        id="price"
        name="price"
        type="number"
        step="0.01"
        min="0.01"
        defaultValue={(product.priceCents / 100).toFixed(2)}
        required
      />

      <label htmlFor="stock">Stock</label>
      <input id="stock" name="stock" type="number" min="0" defaultValue={product.stock} required />

      <label htmlFor="isActive">Visible in the store</label>
      <input id="isActive" name="isActive" type="checkbox" defaultChecked={product.isActive} />

      {error ? <p role="alert">{error}</p> : null}
      {saved ? <p data-testid="product-saved">Saved</p> : null}

      <button type="submit">Save product</button>
    </form>
  );
}
