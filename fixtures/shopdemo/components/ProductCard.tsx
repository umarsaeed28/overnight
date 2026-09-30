import { formatPrice } from "../lib/format";
import type { Product } from "../lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article data-testid={`product-card-${product.sku}`}>
      <a href={`/products/${product.id}`}>
        <h2>{product.name}</h2>
      </a>
      <p>{formatPrice(product.priceCents)}</p>
      {product.stock === 0 ? <p>Out of stock</p> : null}
    </article>
  );
}
