# Order lifecycle

## Statuses

An order moves through the following statuses.

| Status | Meaning |
| --- | --- |
| `PENDING_PAYMENT` | Created, not yet charged. |
| `PAID` | Charge succeeded. |
| `AWAITING_STOCK` | Paid, but at least one line is short. Fulfilment is on hold. |
| `SHIPPED` | Handed to the courier. |
| `CANCELLED` | Cancelled before shipping. Refunds are manual. |

## Transitions

```
PENDING_PAYMENT -> PAID -> AWAITING_STOCK -> SHIPPED
PENDING_PAYMENT -> CANCELLED
PAID            -> CANCELLED
AWAITING_STOCK  -> CANCELLED
```

`SHIPPED` is terminal. There is no `DELIVERED` status; delivery is tracked by the
courier, not by ShopDemo.

## Who moves an order

Only `PENDING_PAYMENT -> PAID` happens in the storefront. Every other transition is
performed by warehouse staff directly against the database. There is no admin UI for
order status and no audit record of who changed it.

## Notifications

A receipt email is sent on `PAID`. No email is sent for `AWAITING_STOCK`, `SHIPPED`, or
`CANCELLED`, which is the single largest source of support contacts.
