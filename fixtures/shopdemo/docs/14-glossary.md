# Glossary

**Cart** — a set of product lines held against a cookie token. May belong to a shopper
or to nobody.

**Line** — one product and a quantity within a cart or an order. Called a "cart item" in
the database.

**Guest** — a buyer who checks out with an email address instead of an account.

**Shopper** — a registered account.

**Admin** — a shopper with the admin flag, able to edit the catalogue.

**Subtotal** — the sum of line prices before shipping. Never includes tax, because there
is no tax.

**Shipping** — the flat delivery fee added to the subtotal, waived above the free
shipping threshold.

**Total** — subtotal plus shipping. What the card is charged.

**SKU** — the human-readable product code, unique and never edited.

**Charge token** — the single-use value representing a card, produced by the payment
provider in the browser. Never stored.

**Reset token** — the single-use value in a password reset link.

**Lockout** — the period during which an account refuses sign-in after repeated
failures.
