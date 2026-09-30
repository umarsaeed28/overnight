import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Heading, Root, RootContent } from "mdast";
import type { DocSection } from "../types.js";

/** Section 10.3: split at H1 to H3; deeper headings stay inside their section. */
const MAX_SPLIT_DEPTH = 3;

export function parseMarkdown(content: string): Root {
  return fromMarkdown(content, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}

function headingText(node: Heading): string {
  return flatten(node.children as RootContent[]).trim();
}

function flatten(nodes: RootContent[]): string {
  return nodes
    .map((node) => {
      if ("value" in node && typeof node.value === "string") return node.value;
      if ("children" in node && Array.isArray(node.children)) {
        return flatten(node.children as RootContent[]);
      }
      return "";
    })
    .join("");
}

/**
 * Sections keep their own heading line and everything under it, so tables and
 * code blocks are never split away from the prose that introduces them.
 */
export function splitMarkdownSections(content: string, rootBreadcrumb = ""): DocSection[] {
  const tree = parseMarkdown(content);
  const lines = content.split("\n");

  const boundaries: { heading: Heading; line: number }[] = [];
  for (const node of tree.children) {
    if (node.type === "heading" && node.depth <= MAX_SPLIT_DEPTH && node.position) {
      boundaries.push({ heading: node, line: node.position.start.line });
    }
  }

  const sections: DocSection[] = [];
  const trail: string[] = [];

  const preambleEnd = (boundaries[0]?.line ?? lines.length + 1) - 1;
  if (preambleEnd > 0 && lines.slice(0, preambleEnd).join("").trim() !== "") {
    sections.push({
      breadcrumb: rootBreadcrumb,
      title: "",
      depth: 0,
      lineStart: 1,
      lineEnd: preambleEnd,
      content: lines.slice(0, preambleEnd).join("\n"),
    });
  }

  boundaries.forEach((boundary, index) => {
    const depth = boundary.heading.depth;
    const title = headingText(boundary.heading);

    trail.length = depth - 1;
    trail[depth - 1] = title;

    const lineStart = boundary.line;
    const lineEnd = (boundaries[index + 1]?.line ?? lines.length + 1) - 1;

    // A page's H1 usually repeats the page title already in the root, and
    // `Space > Cart rules > Cart rules > Expiry` helps nobody.
    const rootLeaf = rootBreadcrumb.split(" > ").at(-1);
    const crumbs = trail.filter(Boolean).filter((crumb, i) => !(i === 0 && crumb === rootLeaf));

    sections.push({
      breadcrumb: [rootBreadcrumb, ...crumbs].filter(Boolean).join(" > "),
      title,
      depth,
      lineStart,
      lineEnd,
      content: lines.slice(lineStart - 1, lineEnd).join("\n").trimEnd(),
    });
  });

  return sections;
}
