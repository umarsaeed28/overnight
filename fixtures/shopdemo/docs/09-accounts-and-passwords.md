# Accounts and passwords

## Registering

A shopper registers with an email address and a password. Email addresses are unique and
compared case-insensitively. There is no email verification step: the account works
immediately.

## Password policy

**Passwords must be at least 12 characters.** There is no upper bound short of the
request body limit, no character class requirement, and no check against a breached
password list.

Passwords are hashed with scrypt and a per-user random salt. The hash and salt are
stored together; the plaintext is never written to disk or to a log.

## Signing in

Sign-in is email plus password. A failure is always reported as "Email or password is
incorrect" so that the form cannot be used to discover which addresses have accounts.

## Lockout

**After 3 consecutive failed sign-in attempts the account is locked for 15 minutes.** A
locked account answers 423 even when the correct password is supplied. A successful
sign-in resets the counter.

The lock is per account, not per IP address, which means an attacker can lock a shopper
out of their own account by guessing badly on purpose. This is a known trade-off.

## Sessions

Sessions are server-side and held in a cookie that is httpOnly and SameSite=Lax. There
is no "remember me" and no session list; signing out drops the one session.
