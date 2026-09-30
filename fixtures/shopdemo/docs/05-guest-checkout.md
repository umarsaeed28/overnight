# Guest checkout

Guests can buy without creating an account. This is the most used path in the store, so
it is also the one most worth protecting.

## What the guest supplies

- An email address. The receipt goes here, and it is the only record linking the buyer
  to the order.
- A shipping address: full name, address line, city, postcode.
- **A phone number. This is required for guest orders** because the courier needs a
  contact number for delivery attempts.
- Card details, collected by the payment provider.

## Order value limit

**A guest order may not exceed $500.** Above that, the shopper is asked to create an
account before paying. The limit exists because guest orders carry more chargeback risk
and there is no account history to check against.

## No account is created

A guest checkout does not create a shopper account, even silently. If the same email
later registers, previous guest orders are not attached to the new account.

## After payment

The confirmation page shows the order reference and status. The guest cannot return to
the order later; there is no guest order lookup page. The receipt email is the record.

## Signing in mid-checkout

The checkout page offers "Sign in instead", which returns to checkout after login. The
cart survives the round trip because it is held in a cookie.
