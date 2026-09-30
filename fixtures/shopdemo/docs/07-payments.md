# Payments

## Provider

Cards are charged through an external provider. ShopDemo never sees or stores a card
number; the browser exchanges the card for a single-use token and the server charges
that token.

## Two-step checkout

Paying is two calls, deliberately:

1. `POST /api/orders` creates the order in `PENDING_PAYMENT` and returns its id.
2. `POST /api/orders/{id}/pay` charges the card and moves the order to `PAID`.

The split means a failed charge leaves a real order behind that support can look at,
rather than losing the attempt entirely.

## Failure handling

- A declined card answers 402 and the order stays `PENDING_PAYMENT`. The shopper can
  retry with a different card.
- Paying an order that is already paid answers 409.
- A provider outage surfaces as a decline to the shopper. There is no queue and no
  retry; the shopper has to try again.

## Known gap

Nothing cleans up orders that stay in `PENDING_PAYMENT`. They accumulate and are counted
in admin exports, which overstates demand.

## Cart clearing

The cart is cleared only after a successful charge, and only for signed-in shoppers. A
guest's cart cookie still points at the cart that was just bought, so a guest who goes
back sees their purchased items still in the cart.
