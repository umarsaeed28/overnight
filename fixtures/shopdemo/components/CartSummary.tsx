import { formatPrice } from "../lib/format";
import type { Cart } from "../lib/types";

export function CartSummary({ cart }: { cart: Cart }) {
  const subtotalCents = cart.items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );

  return (
    <section aria-labelledby="summary-heading" data-testid="cart-summary">
      <h2 id="summary-heading">Order summary</h2>

      <ul>
        {cart.items.map((item) => (
          <li key={item.id}>
            <span>{item.product.name}</span>
            <span data-testid={`quantity-${item.productId}`}>{item.quantity}</span>
            <span>{formatPrice(item.product.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl>
        <dt>Subtotal</dt>
        <dd data-testid="subtotal">{formatPrice(subtotalCents)}</dd>
        <dt>Shipping</dt>
        <dd data-testid="shipping">{formatPrice(cart.shippingCents)}</dd>
        <dt>Total</dt>
        <dd data-testid="total">{formatPrice(subtotalCents + cart.shippingCents)}</dd>
      </dl>
    </section>
  );
}
