# Password reset

## Requesting a reset

The shopper enters an email address at `/forgot-password`. The response is always the
same — "If that email has an account, a reset link is on its way" — whether or not an
account exists. The endpoint answers 202 in both cases so that timing and status code
reveal nothing.

## The reset link

A reset token is a random, single-use value emailed as a link to `/reset-password`.

**A reset link is valid for 1 hour.** After that the token is rejected and the shopper
must request a new one. Requesting a new link invalidates any previous outstanding link
for that account.

## Using the link

The reset page asks for a new password once. The same password policy applies as at
registration.

On success the token is marked used, the password is replaced, and the shopper is sent
to the sign-in page. Existing sessions are **not** invalidated, so a session an attacker
already holds survives a reset. This is a known security gap.

## Failure cases

- Missing token in the URL: the page says the link is not valid, without calling the API.
- Expired or already used token: the API answers 400 and the page shows the message.
- A password that fails the policy: the API answers 400 with the policy message.
