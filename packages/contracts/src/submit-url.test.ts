import { describe, expect, it } from "vitest";
import { SubmitUrl } from "./submit-url.js";

describe("SubmitUrl", () => {
  it.each([
    ["https://my-app.vercel.app", "https://my-app.vercel.app/"],
    ["https://shop.lovable.app/products?x=1", "https://shop.lovable.app/products?x=1"],
    ["https://thing.bolt.new", "https://thing.bolt.new/"],
    ["https://x.replit.app", "https://x.replit.app/"],
    ["https://site.netlify.app/#top", "https://site.netlify.app/"],
    ["https://www.mycustomdomain.co.uk", "https://www.mycustomdomain.co.uk/"],
    ["  myapp.vercel.app  ", "https://myapp.vercel.app/"],
  ])("accepts %s", (input, expected) => {
    expect(SubmitUrl.parse(input)).toBe(expected);
  });

  it.each([
    ["", "empty"],
    ["http://myapp.vercel.app", "plain http"],
    ["ftp://myapp.com", "other scheme"],
    ["https://localhost:3000", "localhost"],
    ["https://app.localhost", ".localhost"],
    ["https://127.0.0.1", "ipv4"],
    ["https://127.1", "short ipv4"],
    ["https://2130706433", "decimal ipv4"],
    ["https://10.0.0.5/admin", "private ipv4"],
    ["https://[::1]/", "ipv6"],
    ["https://printer.local", ".local"],
    ["https://db.internal", ".internal"],
    ["https://user:pw@myapp.com", "credentials"],
    ["https://intranet", "single label"],
    ["https://my app.com", "space"],
    ["javascript:alert(1)", "javascript scheme"],
  ])("rejects %s (%s)", (input) => {
    expect(SubmitUrl.safeParse(input).success).toBe(false);
  });

  it("explains what to fix", () => {
    const result = SubmitUrl.safeParse("http://myapp.com");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/https/);
  });
});
