import { z } from "zod";

export type SubmitUrlResult = { ok: true; url: string } | { ok: false; message: string };

/** Suffixes that only resolve inside a private network. */
const PRIVATE_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".lan",
  ".home",
  ".corp",
  ".intranet",
  ".test",
  ".invalid",
  ".example",
];

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/** People paste "myapp.vercel.app"; treat a missing scheme as https. */
function withScheme(raw: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/**
 * Validates a URL a customer wants checked. Public https hostnames only: no
 * IP addresses (the WHATWG parser folds `127.1` and `2130706433` into dotted
 * form, so the IPv4 test catches those too), no localhost, no private-network
 * suffixes and no embedded credentials. Returns the normalised URL, without a
 * fragment.
 */
export function checkSubmitUrl(input: string): SubmitUrlResult {
  const raw = input.trim();
  if (raw === "") return { ok: false, message: "Paste the link to your app." };
  if (raw.length > 2048) return { ok: false, message: "That link is too long." };
  if (/\s/.test(raw)) return { ok: false, message: "Links can't contain spaces." };

  let url: URL;
  try {
    url = new URL(withScheme(raw));
  } catch {
    return { ok: false, message: "That doesn't look like a link. Try https://yourapp.com." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, message: "We only check https links. Use https:// instead." };
  }
  if (url.username !== "" || url.password !== "") {
    return { ok: false, message: "Remove the username and password from the link." };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") || IPV4.test(host)) {
    return { ok: false, message: "Use your app's domain name, not an IP address." };
  }
  if (host === "localhost" || PRIVATE_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, message: "We can only reach public apps, not localhost or private hosts." };
  }

  const labels = host.split(".");
  const tld = labels[labels.length - 1] ?? "";
  const validTld = /^[a-z]{2,}$/.test(tld) || /^xn--[a-z0-9-]+$/.test(tld);
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l)) || !validTld) {
    return { ok: false, message: "That doesn't look like a public domain. Try yourapp.vercel.app." };
  }

  url.hash = "";
  return { ok: true, url: url.toString() };
}

/** Zod form of {@link checkSubmitUrl}: parses to the normalised URL string. */
export const SubmitUrl = z.string().transform((value, ctx) => {
  const result = checkSubmitUrl(value);
  if (!result.ok) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
    return z.NEVER;
  }
  return result.url;
});
