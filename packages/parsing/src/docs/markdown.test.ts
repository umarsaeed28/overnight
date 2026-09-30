import { describe, expect, it } from "vitest";
import { splitMarkdownSections } from "./markdown.js";

const DOC = `# Cart rules

Intro paragraph.

## Expiry

A cart expires 24 hours after it is created.

### Warning

Shoppers are not warned.

## Quantity limits

| Limit | Value |
| --- | --- |
| Per line | 10 |

\`\`\`ts
const MAX = 10;
## not a heading
\`\`\`

#### Deep note

Stays inside quantity limits.
`;

describe("splitMarkdownSections", () => {
  it("splits at H1 to H3", () => {
    const sections = splitMarkdownSections(DOC);

    expect(sections.map((s) => s.title)).toEqual([
      "Cart rules",
      "Expiry",
      "Warning",
      "Quantity limits",
    ]);
  });

  it("builds a breadcrumb from the heading trail", () => {
    const sections = splitMarkdownSections(DOC);

    expect(sections.map((s) => s.breadcrumb)).toEqual([
      "Cart rules",
      "Cart rules > Expiry",
      "Cart rules > Expiry > Warning",
      "Cart rules > Quantity limits",
    ]);
  });

  it("prefixes the breadcrumb with the space and page when given one", () => {
    const sections = splitMarkdownSections(DOC, "ShopDemo > Cart rules");
    expect(sections[1]!.breadcrumb).toBe("ShopDemo > Cart rules > Expiry");
  });

  it("keeps a table inside its section", () => {
    const quantity = splitMarkdownSections(DOC).find((s) => s.title === "Quantity limits");
    expect(quantity!.content).toContain("| Per line | 10 |");
  });

  it("does not split on a heading inside a code block", () => {
    const quantity = splitMarkdownSections(DOC).find((s) => s.title === "Quantity limits");
    expect(quantity!.content).toContain("## not a heading");
  });

  it("keeps an H4 inside its parent section", () => {
    const quantity = splitMarkdownSections(DOC).find((s) => s.title === "Quantity limits");
    expect(quantity!.content).toContain("#### Deep note");
  });

  it("records 1-based inclusive line ranges", () => {
    const [first, second] = splitMarkdownSections(DOC);

    expect(first).toMatchObject({ lineStart: 1 });
    expect(second!.lineStart).toBe(5);
    expect(first!.lineEnd).toBe(second!.lineStart - 1);
  });

  it("keeps content that appears before the first heading", () => {
    const sections = splitMarkdownSections("Loose intro.\n\n# Title\n\nBody.");

    expect(sections[0]).toMatchObject({ title: "", depth: 0, content: "Loose intro.\n" });
  });

  it("returns a single section for a document with no headings", () => {
    const sections = splitMarkdownSections("Just prose.\n");

    expect(sections).toHaveLength(1);
    expect(sections[0]!.title).toBe("");
  });

  it("returns nothing for empty content", () => {
    expect(splitMarkdownSections("")).toEqual([]);
  });

  it("resets the trail when a shallower heading appears", () => {
    const sections = splitMarkdownSections("# A\n## B\n### C\n## D\n");
    expect(sections.at(-1)!.breadcrumb).toBe("A > D");
  });
});
