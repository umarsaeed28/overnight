# User roles

ShopDemo has three kinds of user.

## Guest

Not signed in. Can browse, search, hold a cart, and complete checkout by supplying an
email address. Cannot see order history.

## Shopper

A registered account. Everything a guest can do, plus:

- Order history at `/orders`.
- Orders are linked to the account rather than an email address.

## Admin

A shopper account with the admin flag set. In addition to shopper abilities:

- Edit any product at `/admin/products/{id}/edit`.
- Take products off sale by clearing "Visible in the store".

Admin status is set directly in the database. There is no UI for promoting a shopper to
admin, and no audit trail of who changed a product.

## Authorisation rules

- Admin-only endpoints answer 403 to a signed-in non-admin, and 401 when nobody is
  signed in.
- A shopper can only read their own orders. Requesting another shopper's order answers
  404 rather than 403, so order ids cannot be probed.
