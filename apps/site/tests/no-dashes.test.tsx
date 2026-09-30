import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { alt as opengraphAlt } from "../app/opengraph-image";
import HomePage from "../app/page";
import { siteMetadata } from "../app/metadata";

/** Hyphen, en dash, em dash. None of these may reach a human reader. */
const FORBIDDEN = ["\u002D", "\u2013", "\u2014"];

/** Attributes whose values are read aloud or shown to people. */
const READABLE_ATTRIBUTES = [
  "alt",
  "aria-label",
  "aria-description",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "placeholder",
  "title",
  "content",
];

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#x2F;|&#47;/g, "/")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

/** Everything a person can read: text nodes plus human facing attributes. */
function readableStrings(html: string): string[] {
  const withoutInvisible = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, "");

  const found: string[] = [];

  for (const match of withoutInvisible.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
    const name = match[1]?.toLowerCase();
    if (name && READABLE_ATTRIBUTES.includes(name)) found.push(decode(match[2] ?? ""));
  }

  for (const chunk of withoutInvisible.replace(/<[^>]*>/g, "\u0000").split("\u0000")) {
    const text = decode(chunk).trim();
    if (text) found.push(text);
  }

  return found;
}

function offenders(strings: string[]): string[] {
  return strings.filter((value) => FORBIDDEN.some((dash) => value.includes(dash)));
}

describe("no dash characters reach a reader", () => {
  const html = renderToStaticMarkup(<HomePage />);

  it("renders the page", () => {
    expect(html).toContain("Ship at dusk.");
  });

  it("has no hyphen, en dash or em dash in visible text", () => {
    expect(offenders(readableStrings(html))).toEqual([]);
  });

  it("has no hyphen, en dash or em dash in metadata", () => {
    const meta = [
      String(siteMetadata.title),
      String(siteMetadata.description),
      String(siteMetadata.openGraph?.title),
      String(siteMetadata.openGraph?.description),
      opengraphAlt,
    ];

    expect(offenders(meta)).toEqual([]);
  });

  it("catches a dash if one is introduced", () => {
    expect(offenders(readableStrings("<p>read only access</p>"))).toEqual([]);
    expect(offenders(readableStrings("<p>read\u2011only</p>"))).toEqual([]);
    expect(offenders(readableStrings("<p>read-only</p>"))).toEqual(["read-only"]);
    expect(offenders(readableStrings('<img alt="dusk \u2014 dawn">'))).toEqual([
      "dusk \u2014 dawn",
    ]);
  });
});
