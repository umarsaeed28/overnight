# Integrations

ShopDemo owns everything except three outside services.

## Payments

An external card provider. The storefront posts an amount and a single-use card token
and gets back a charge with a status. The API key lives in `PAYMENTS_API_KEY`.

There is no webhook: ShopDemo learns the outcome only from the response to its own
request. A charge that succeeds after a timeout is therefore invisible, and the shopper
is told the payment failed.

## Email

Outbound only, over SMTP, configured by `SMTP_URL`. Two emails exist: the password
reset link and the order receipt. Delivery failures are not retried and not surfaced
anywhere; a shopper whose receipt bounces simply never gets one.

## Database

PostgreSQL through Prisma. Schema changes go through Prisma migrations. There is no
read replica and no connection pooler, so a slow query is felt everywhere.

## What is not integrated

- No analytics or tracking.
- No courier API. Tracking numbers are not held at all.
- No inventory system. Stock is a number an admin types.
- No search service. Search is a `LIKE` against product names.
