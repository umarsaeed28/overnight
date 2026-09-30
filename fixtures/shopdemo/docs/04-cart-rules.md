# Cart rules

## Identity

A cart is identified by the `cart_token` cookie, which is httpOnly and SameSite=Lax. A
signed-in shopper's cart is additionally linked to their user id.

## Expiry

**A cart expires 24 hours after it is created.** An expired cart is treated as missing
and a fresh empty cart is created on the next request. Shoppers are not warned before a
cart expires.

## Quantity limits

**A single line may hold at most 10 units of a product.** Asking for more than 10 is
clamped down to 10 rather than rejected, so the shopper sees the quantity change instead
of an error.

There is no limit on the number of distinct lines in a cart.

## Stock

Stock is checked when a line is added, not continuously. A cart may therefore contain
more units than are in stock by the time checkout happens; checkout does not re-check.

## Merging

When a guest with a cart signs in, the guest cart is **not** merged into any cart already
attached to the account. The guest cart simply keeps being used. This surprises shoppers
who added items on another device.

## Removing items

Removing a line deletes it outright. There is no undo and no "saved for later".
