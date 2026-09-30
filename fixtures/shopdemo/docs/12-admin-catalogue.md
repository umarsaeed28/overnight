# Admin catalogue

## Access

`/admin/products/{id}/edit` is reachable only by an account with the admin flag. A
signed-in non-admin is redirected to the home page; the API behind it answers 403.

## Editable fields

- Name
- Description
- Price
- Stock
- Visible in the store

SKU is not editable. There is no create or delete: products are added by a database
seed and retired by clearing the visible flag.

## Price guard rails

**A single edit may not change a price by more than 50% in either direction.** A larger
change is rejected with a validation message and the admin has to make the change in
steps. The rule exists because a mistyped price is the most expensive mistake an admin
can make, and there is no approval step and no undo.

## Stock

Stock is a plain integer that admins overwrite. It is decremented nowhere: buying a
product does not reduce its stock. Warehouse staff correct the numbers by hand, which
means the "Out of stock" state on the storefront is only as fresh as the last manual
edit.

## Audit

No audit record is kept of who changed what. The only evidence of an edit is the
`updatedAt` timestamp on the product row.
