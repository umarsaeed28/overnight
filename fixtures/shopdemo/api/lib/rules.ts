/** Business limits enforced by the API. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** How long an anonymous cart survives. */
export const CART_TTL_DAYS = 7;

/** Orders above this subtotal ship free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const FLAT_SHIPPING_CENTS = 599;

/** Per line item. */
export const MAX_QUANTITY_PER_LINE = 99;

/** Password reset links expire after this long. */
export const RESET_TOKEN_TTL_HOURS = 24;

/** Failed sign-ins before the account is locked. */
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

export function shippingFor(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}
