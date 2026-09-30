# Order history

## Who sees it

Only signed-in shoppers. `/orders` redirects to sign-in and returns to the history page
afterwards.

## What it shows

A table of the shopper's orders, newest first: a shortened order reference, the date it
was placed, the status, and the total. Every order the account owns appears; there is no
pagination, so an account with hundreds of orders renders them all.

## Empty state

A shopper with no orders sees "You have not placed an order yet." rather than an empty
table.

## Order detail

Following a reference opens the order, showing the lines with the price paid at the time
of purchase, not the current price.

## Guest orders

Guest orders never appear here, even when the account email matches the email used at
guest checkout. There is no way to claim a past guest order.

## Statuses shown

The status is shown as the raw value from the database, for example `PENDING_PAYMENT`.
There is no friendly label and no explanation of what each status means.
