import { CartSummary } from "../../components/CartSummary";
import { fetchCart } from "../../lib/api";

export const metadata = { title: "Your cart · ShopDemo" };

export default async function CartPage() {
  const cart = await fetchCart();
  const isEmpty = cart.items.length === 0;

  return (
    <main>
      <h1>Your cart</h1>

      {isEmpty ? (
        <p data-testid="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <CartSummary cart={cart} />
          <a href="/checkout" data-testid="checkout-link">
            Checkout
          </a>
        </>
      )}
    </main>
  );
}
