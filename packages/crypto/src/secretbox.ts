import { createRequire } from "node:module";
import type sodiumTypes from "libsodium-wrappers";

// libsodium-wrappers 0.7.16 ships an ESM entry that imports a file it does not
// publish, so the CommonJS build is loaded directly.
const sodium = createRequire(import.meta.url)("libsodium-wrappers") as typeof sodiumTypes;

/**
 * Connector credentials are sealed with libsodium `crypto_secretbox` under
 * `ENCRYPTION_KEY` (section 23). Sealed values are stored as
 * `[version byte][nonce][ciphertext]` so the key can be rotated without
 * guessing how an old row was written.
 */
const FORMAT_VERSION = 1;

export async function ready(): Promise<void> {
  await sodium.ready;
}

export function keyFromBase64(base64: string): Uint8Array {
  const key = Buffer.from(base64, "base64");
  if (key.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error(
      `ENCRYPTION_KEY must decode to ${sodium.crypto_secretbox_KEYBYTES} bytes, got ${key.length}`,
    );
  }
  return new Uint8Array(key);
}

export function seal(plaintext: string, key: Uint8Array): Buffer {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(sodium.from_string(plaintext), nonce, key);

  return Buffer.concat([Buffer.from([FORMAT_VERSION]), Buffer.from(nonce), Buffer.from(ciphertext)]);
}

export class SealedValueError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SealedValueError";
  }
}

export function open(sealed: Buffer | Uint8Array, key: Uint8Array): string {
  const bytes = Buffer.from(sealed);
  const nonceLength = sodium.crypto_secretbox_NONCEBYTES;

  if (bytes.length < 1 + nonceLength + sodium.crypto_secretbox_MACBYTES) {
    throw new SealedValueError("Sealed value is too short to be valid.");
  }
  if (bytes[0] !== FORMAT_VERSION) {
    throw new SealedValueError(`Unknown sealed value format ${bytes[0]}.`);
  }

  const nonce = new Uint8Array(bytes.subarray(1, 1 + nonceLength));
  const ciphertext = new Uint8Array(bytes.subarray(1 + nonceLength));

  try {
    return sodium.to_string(sodium.crypto_secretbox_open_easy(ciphertext, nonce, key));
  } catch (error) {
    // Never echo the ciphertext or the key in the message.
    throw new SealedValueError("Sealed value did not open with this key.", { cause: error });
  }
}

/** Credentials are a small record, sealed as one JSON blob. */
export function sealCredentials(credentials: Record<string, string>, key: Uint8Array): Buffer {
  return seal(JSON.stringify(credentials), key);
}

export function openCredentials(
  sealed: Buffer | Uint8Array,
  key: Uint8Array,
): Record<string, string> {
  const parsed: unknown = JSON.parse(open(sealed, key));
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new SealedValueError("Sealed credentials were not an object.");
  }
  return parsed as Record<string, string>;
}
