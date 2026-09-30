import { notFound } from "next/navigation";
import { AddToCartButton } from "../../../components/AddToCartButton";
import { fetchProduct } from "../../../lib/api";
import { formatPrice } from "../../../lib/format";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  if (!product) notFound();

  const outOfStock = product.stock === 0;

  return (
    <main>
      <h1>{product.name}</h1>
      <p data-testid="product-price">{formatPrice(product.priceCents)}</p>
      <p>{product.description}</p>

      {outOfStock ? (
        <p data-testid="out-of-stock">Out of stock</p>
      ) : (
        <AddToCartButton productId={product.id} maxQuantity={product.stock} />
      )}

      <a href="/cart">View cart</a>
    </main>
  );
}
