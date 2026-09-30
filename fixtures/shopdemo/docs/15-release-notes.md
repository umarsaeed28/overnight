# Release notes

## 1.4.0

- Guest checkout no longer creates a silent account.
- Order history shows the price paid rather than the current price.
- Search is case-insensitive.

## 1.3.0

- Added the admin product edit page.
- Added the price change guard rail.
- Product visibility replaced the earlier hard delete.

## 1.2.0

- Two-step checkout: orders are created before the card is charged, so a decline leaves
  a record.
- Declines answer 402 and keep the order in `PENDING_PAYMENT`.

## 1.1.0

- Password reset by emailed link.
- Account lockout after repeated failed sign-ins.
- Sign-in failures no longer distinguish unknown email from wrong password.

## 1.0.0

- First release: catalogue, cart, guest checkout, accounts, order history.

## Known issues carried forward

- Stock is never decremented by a purchase.
- No email is sent for any status change after payment.
- Orders stuck in `PENDING_PAYMENT` are never cleaned up.
- A password reset does not invalidate existing sessions.
