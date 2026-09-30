# Shipping and fees

## Flat rate

Standard shipping is a flat $5.00 per order, regardless of weight, size, or number of
lines. There is no express option.

## Free shipping

**Shipping is free when the order subtotal is over $50.** The threshold is applied to
the subtotal before shipping, and it is a strict "over", so an order of exactly $50 still
pays the flat rate.

The threshold is a business decision that changes during promotions. It lives in one
place in the code so marketing can ask for a change without a redesign.

## Taxes

No tax is calculated or displayed. The displayed price is what the shopper pays. This is
a deliberate simplification of the demo and would not survive a real launch.

## Currency

USD only. Prices are held in integer cents throughout and only formatted at the edge.

## Where shipping is computed

The subtotal is summed from cart lines at their current product price, not at the price
when the line was added. A price change between adding to cart and checking out silently
changes what the shopper pays.
