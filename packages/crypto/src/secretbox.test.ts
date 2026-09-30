import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  SealedValueError,
  keyFromBase64,
  open,
  openCredentials,
  ready,
  seal,
  sealCredentials,
} from "./secretbox.js";

const key = () => keyFromBase64(randomBytes(32).toString("base64"));

beforeAll(async () => {
  await ready();
});

describe("keyFromBase64", () => {
  it("accepts a 32 byte key", () => {
    expect(keyFromBase64(randomBytes(32).toString("base64"))).toHaveLength(32);
  });

  it("rejects a key of the wrong length", () => {
    expect(() => keyFromBase64(randomBytes(16).toString("base64"))).toThrow(/32 bytes/);
  });
});

describe("seal and open", () => {
  it("round-trips a token", () => {
    const k = key();
    expect(open(seal("ghs_exampletoken", k), k)).toBe("ghs_exampletoken");
  });

  it("round-trips non-ascii", () => {
    const k = key();
    expect(open(seal("pass·wörd—✓", k), k)).toBe("pass·wörd—✓");
  });

  it("produces a different ciphertext every time", () => {
    const k = key();
    expect(seal("same", k).equals(seal("same", k))).toBe(false);
  });

  it("never contains the plaintext", () => {
    const k = key();
    expect(seal("ghs_exampletoken", k).toString("utf8")).not.toContain("ghs_exampletoken");
  });

  it("refuses another key", () => {
    expect(() => open(seal("secret", key()), key())).toThrow(SealedValueError);
  });

  it("refuses a tampered ciphertext", () => {
    const k = key();
    const sealed = seal("secret", k);
    const last = sealed.length - 1;
    sealed.writeUInt8(sealed.readUInt8(last) ^ 0xff, last);

    expect(() => open(sealed, k)).toThrow(SealedValueError);
  });

  it("refuses a value that is too short", () => {
    expect(() => open(Buffer.from([1, 2, 3]), key())).toThrow(/too short/);
  });

  it("refuses an unknown format version", () => {
    const k = key();
    const sealed = seal("secret", k);
    sealed[0] = 9;

    expect(() => open(sealed, k)).toThrow(/Unknown sealed value format/);
  });

  it("does not leak the key or ciphertext in the error", () => {
    const k = key();
    const sealed = seal("secret", k);

    try {
      open(sealed, key());
      expect.unreachable("open should have thrown");
    } catch (error) {
      expect((error as Error).message).toBe("Sealed value did not open with this key.");
    }
  });
});

describe("credentials", () => {
  it("round-trips a credential record", () => {
    const k = key();
    const sealed = sealCredentials({ installationId: "12345", host: "github.com" }, k);

    expect(openCredentials(sealed, k)).toEqual({ installationId: "12345", host: "github.com" });
  });

  it("rejects sealed content that is not an object", () => {
    const k = key();
    expect(() => openCredentials(seal('"a string"', k), k)).toThrow(/not an object/);
  });
});
