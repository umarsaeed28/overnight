import type { ParsedFile, ParsedSymbol } from "../types.js";
import { createParser, languageForPath, type SyntaxNode } from "../code/languages.js";
import { argumentNodes, callee, lineRange, stringLiteral } from "../code/nodes.js";

export type TestFramework = "playwright" | "cypress" | "jest" | "vitest" | "unknown";

const SUITE_NAMES = new Set(["describe", "suite", "context"]);
const TEST_NAMES = new Set(["test", "it", "specify"]);
/** `test.skip`, `it.only`, `describe.each` all still declare a test. */
const MODIFIERS = new Set(["skip", "only", "todo", "fails", "concurrent", "serial", "each", "fixme"]);

const NAVIGATION_CALLS = new Set(["goto", "visit"]);
const SELECTOR_CALLS = new Set([
  "getByRole",
  "getByTestId",
  "getByLabel",
  "getByLabelText",
  "getByText",
  "getByPlaceholder",
  "locator",
  "get",
  "find",
  "querySelector",
]);
const HTTP_VERBS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);
const REQUEST_RECEIVERS = new Set(["request", "api", "http", "axios", "supertest"]);

export function detectFramework(path: string, content: string): TestFramework {
  if (content.includes("@playwright/test")) return "playwright";
  if (/(^|\/)cypress\//.test(path) || content.includes("cy.")) return "cypress";
  if (content.includes("vitest")) return "vitest";
  if (content.includes("@jest/globals") || content.includes("jest.")) return "jest";
  return "unknown";
}

export async function parseTestSymbols(path: string, content: string): Promise<ParsedFile> {
  const language = languageForPath(path);
  if (!language) return { symbols: [], detectors: [] };

  const parser = await createParser(language);
  const tree = parser.parse(content);
  const framework = detectFramework(path, content);

  const symbols: ParsedSymbol[] = [];
  walk(tree.rootNode, [], symbols, framework);

  symbols.sort((a, b) => a.lineStart - b.lineStart);

  return {
    symbols,
    detectors: symbols.length > 0 ? [`${framework}_tests`] : [],
  };
}

function walk(
  node: SyntaxNode,
  suitePath: string[],
  symbols: ParsedSymbol[],
  framework: TestFramework,
): void {
  if (node.type === "call_expression") {
    const declaration = readDeclaration(node);

    if (declaration?.kind === "suite") {
      symbols.push({
        kind: "test_suite",
        name: [...suitePath, declaration.title].join(" > "),
        signature: declaration.title,
        ...lineRange(node),
        meta: { title: declaration.title, framework, suite: suitePath },
      });

      const body = argumentNodes(node)[1];
      if (body) walk(body, [...suitePath, declaration.title], symbols, framework);
      return;
    }

    if (declaration?.kind === "test") {
      const body = argumentNodes(node).at(-1);

      symbols.push({
        kind: "test",
        name: [...suitePath, declaration.title].join(" > "),
        signature: declaration.title,
        ...lineRange(node),
        meta: {
          title: declaration.title,
          framework,
          suite: suitePath,
          tags: tagsIn(declaration.title),
          ...(body ? collectBehaviour(body) : emptyBehaviour()),
        },
      });
      return;
    }
  }

  for (let i = 0; i < node.namedChildCount; i += 1) {
    const child = node.namedChild(i);
    if (child) walk(child, suitePath, symbols, framework);
  }
}

interface Declaration {
  kind: "suite" | "test";
  title: string;
}

function readDeclaration(node: SyntaxNode): Declaration | undefined {
  const base = baseCalleeName(node);
  if (!base) return undefined;

  const title = stringLiteral(argumentNodes(node)[0]);
  if (title === undefined) return undefined;

  if (SUITE_NAMES.has(base)) return { kind: "suite", title };
  if (TEST_NAMES.has(base)) return { kind: "test", title };
  return undefined;
}

/** `test.describe.skip("x")` reduces to `describe`. */
function baseCalleeName(node: SyntaxNode): string | undefined {
  const { name, object, property } = callee(node);
  if (name) return name;
  if (!object || !property) return undefined;

  const parts = [...object.split("."), property].filter((part) => !MODIFIERS.has(part));

  // `test.describe` is a suite; `test.skip` is still a test.
  for (const part of [...parts].reverse()) {
    if (SUITE_NAMES.has(part) || TEST_NAMES.has(part)) return part;
  }

  return undefined;
}

function tagsIn(title: string): string[] {
  return [...title.matchAll(/@([\w-]+)/g)].map((match) => match[1] as string);
}

interface Behaviour {
  visited_paths: string[];
  selectors: string[];
  api_calls: { method: string; path: string }[];
  assertion_count: number;
}

function emptyBehaviour(): Behaviour {
  return { visited_paths: [], selectors: [], api_calls: [], assertion_count: 0 };
}

/**
 * What a test touches, which is what coverage mapping (section 16) matches
 * against routes, pages and components.
 */
function collectBehaviour(body: SyntaxNode): Behaviour {
  const visited = new Set<string>();
  const selectors = new Set<string>();
  const apiCalls = new Map<string, { method: string; path: string }>();
  let assertions = 0;

  const stack: SyntaxNode[] = [body];

  while (stack.length > 0) {
    const node = stack.pop() as SyntaxNode;

    if (node.type === "call_expression") {
      const { name, object, property } = callee(node);
      const args = argumentNodes(node);
      const first = stringLiteral(args[0]);

      if (name === "expect") assertions += 1;

      if (property && NAVIGATION_CALLS.has(property) && first !== undefined) visited.add(first);

      if (property && SELECTOR_CALLS.has(property)) {
        // `cy.get(".x")` is a selector; `map.get(k)` is not.
        const isSelectorContext = property !== "get" || object === "cy";
        if (isSelectorContext && first !== undefined) selectors.add(first);
      }

      if (
        property &&
        HTTP_VERBS.has(property) &&
        object &&
        REQUEST_RECEIVERS.has(object.split(".")[0] ?? "") &&
        first !== undefined
      ) {
        const call = { method: property.toUpperCase(), path: first };
        apiCalls.set(`${call.method} ${call.path}`, call);
      }

      if (name === "fetch" && first !== undefined) {
        apiCalls.set(`GET ${first}`, { method: "GET", path: first });
      }
    }

    for (let i = 0; i < node.namedChildCount; i += 1) {
      const child = node.namedChild(i);
      if (child) stack.push(child);
    }
  }

  return {
    visited_paths: [...visited].sort(),
    selectors: [...selectors].sort(),
    api_calls: [...apiCalls.values()].sort((a, b) => a.path.localeCompare(b.path)),
    assertion_count: assertions,
  };
}
