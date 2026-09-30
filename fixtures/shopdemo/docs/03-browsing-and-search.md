# Browsing and search

## Product list

The home page lists active products alphabetically by name, 24 per page. Products with
"Visible in the store" cleared never appear, even by direct link.

Pagination is a simple previous/next pair. There is no total count, so the "Next" link
is shown even on the last page and lands on an empty list. This is a known rough edge.

## Search

The search box filters on product name only, case-insensitively, using a substring
match. Descriptions and SKUs are not searched.

When nothing matches, the page shows "No products match that search." rather than an
empty grid.

## Product page

A product page shows name, price, description, and either an add-to-cart control or an
"Out of stock" message when stock is zero.

The quantity input is capped at the current stock level. Stock is checked again on the
server when the item is added, so a product that sells out between page load and click
returns "Not enough stock".

## Prices

All prices are stored and compared in integer cents and formatted for display in US
dollars. There is no multi-currency support.
