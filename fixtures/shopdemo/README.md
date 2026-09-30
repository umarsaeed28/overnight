# ShopDemo fixture

A small but real storefront used as the offline fixture workspace (spec section 22.6).
The `fixture` connector reads these folders as if they were GitHub, Confluence and Jira:

| Folder | Read as |
|---|---|
| `app/`, `api/`, `prisma/`, `tests/` | a GitHub repository |
| `docs/` | a Confluence space export |
| `tickets/` | a Jira project export |

`SEEDED_CONFLICTS.json` lists ten deliberate disagreements between the docs and the
code. The `conflict_detection` eval suite scores the pipeline against that list, so the
file is the answer key and must stay in step with both sides.

## What is here

- **Storefront** (`app/`, `components/`, `lib/`): product list, product page, cart,
  checkout, login, forgot and reset password, order history, order detail, and the
  admin product edit page.
- **API** (`api/`): Express routes for `/api/products`, `/api/cart`, `/api/orders`, and
  `/api/auth/*`, with the business limits gathered in `api/lib/rules.ts`.
- **Schema** (`prisma/`): User, PasswordReset, Product, Cart, CartItem, Order,
  OrderItem, plus a seed with ten readable product ids.
- **Tests** (`tests/e2e/`): 12 Playwright tests. They cover browsing, the cart,
  checkout, and sign-in. Password reset, order history, and the admin catalogue have no
  tests at all, which is the gap the coverage mapping is expected to find.
- **Docs** (`docs/`): 15 pages.
- **Tickets** (`tickets/`): 40 JSON tickets, `SHOP-101` to `SHOP-140`.

Nothing here is meant to run. It is meant to be *read*: parsed, chunked, clustered and
reverse engineered.
