# ShopDemo product overview

ShopDemo is a small direct-to-consumer storefront. Shoppers browse a catalogue, add
products to a cart, and buy either as a guest or with an account. A small admin surface
lets staff keep the catalogue up to date.

## What the product does

- **Browse and search.** Anyone can list products and open a product page.
- **Cart.** Anonymous carts are supported; a cart is identified by a cookie.
- **Checkout.** Guests check out with an email address. Signed-in shoppers reuse their
  saved details.
- **Accounts.** Email and password. Shoppers can reset a forgotten password.
- **Order history.** Signed-in shoppers can see their past orders and statuses.
- **Admin catalogue.** Staff can edit product name, description, price, stock, and
  whether the product is visible.

## What it does not do

- No saved payment methods. Card details are collected fresh at every checkout.
- No returns or refunds flow. Refunds are issued manually in the payment provider.
- No guest order lookup. Once a guest closes the confirmation page, the order is only
  reachable from the receipt email.

## Primary journeys

1. Find a product → add to cart → guest checkout → pay.
2. Sign in → add to cart → checkout with saved address → pay.
3. Forgot password → reset → sign in.
4. Admin edits a price or takes a product off sale.
