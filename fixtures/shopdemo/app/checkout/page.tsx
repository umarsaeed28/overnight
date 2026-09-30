import { redirect } from "next/navigation";
import { AddressForm } from "../../components/AddressForm";
import { PaymentForm } from "../../components/PaymentForm";
import { CartSummary } from "../../components/CartSummary";
import { fetchCart, getSession } from "../../lib/api";

export const metadata = { title: "Checkout · ShopDemo" };

/**
 * Checkout works for guests and for signed-in shoppers. A guest supplies an
 * email address instead of signing in.
 */
export default async function CheckoutPage() {
  const [cart, session] = await Promise.all([fetchCart(), getSession()]);

  if (cart.items.length === 0) redirect("/cart");

  const isGuest = !session?.userId;

  return (
    <main>
      <h1>Checkout</h1>
      <CartSummary cart={cart} />

      {isGuest ? (
        <section aria-labelledby="guest-heading">
          <h2 id="guest-heading">Continue as guest</h2>
          <p>We will email your receipt. No account needed.</p>
          <label htmlFor="guest-email">Email</label>
          <input id="guest-email" name="email" type="email" required data-testid="guest-email" />
          <a href="/login?next=/checkout">Sign in instead</a>
        </section>
      ) : (
        <p data-testid="signed-in-as">Signed in as {session.email}</p>
      )}

      <AddressForm />
      <PaymentForm totalCents={cart.totalCents} />
    </main>
  );
}
