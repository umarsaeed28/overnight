import { encode } from "@auth/core/jwt";
import { describe, expect, it } from "vitest";
import { authJsVerifier } from "./auth.js";

const secret = "test-auth-secret-0123456789";

const requestWith = (cookies: Record<string, string>) =>
  ({ cookies }) as unknown as Parameters<ReturnType<typeof authJsVerifier>>[0];

const token = (salt: string, payload: Record<string, unknown>) =>
  encode({ token: payload, secret, salt, maxAge: 3600 });

describe("authJsVerifier", () => {
  it("reads the user out of an Auth.js session cookie", async () => {
    const verify = authJsVerifier(secret);
    const cookie = await token("authjs.session-token", {
      sub: "9f1c0f0c-0000-4000-8000-000000000001",
      email: "qa@example.com",
    });

    await expect(verify(requestWith({ "authjs.session-token": cookie }))).resolves.toEqual({
      id: "9f1c0f0c-0000-4000-8000-000000000001",
      email: "qa@example.com",
    });
  });

  it("accepts the __Secure- cookie name used over https", async () => {
    const verify = authJsVerifier(secret);
    const name = "__Secure-authjs.session-token";
    const cookie = await token(name, { sub: "user-1", email: "qa@example.com" });

    await expect(verify(requestWith({ [name]: cookie }))).resolves.toMatchObject({
      id: "user-1",
    });
  });

  it("rejects a token sealed with a different secret", async () => {
    const cookie = await token("authjs.session-token", { sub: "user-1", email: "a@b.c" });
    const verify = authJsVerifier("a-completely-different-secret");

    await expect(verify(requestWith({ "authjs.session-token": cookie }))).resolves.toBeNull();
  });

  it("rejects a token whose salt does not match the cookie it arrived in", async () => {
    const cookie = await token("__Secure-authjs.session-token", {
      sub: "user-1",
      email: "a@b.c",
    });
    const verify = authJsVerifier(secret);

    await expect(verify(requestWith({ "authjs.session-token": cookie }))).resolves.toBeNull();
  });

  it("rejects a session with no subject or no email", async () => {
    const verify = authJsVerifier(secret);
    const noSub = await token("authjs.session-token", { email: "a@b.c" });
    const noEmail = await token("authjs.session-token", { sub: "user-1" });

    await expect(verify(requestWith({ "authjs.session-token": noSub }))).resolves.toBeNull();
    await expect(verify(requestWith({ "authjs.session-token": noEmail }))).resolves.toBeNull();
  });

  it("returns null when there is no cookie at all", async () => {
    await expect(authJsVerifier(secret)(requestWith({}))).resolves.toBeNull();
  });

  it("ignores a garbage cookie value", async () => {
    await expect(
      authJsVerifier(secret)(requestWith({ "authjs.session-token": "not-a-jwe" })),
    ).resolves.toBeNull();
  });
});
