import type { SymbolKind } from "@oqa/core";
import type { ParsedFile, ParsedSymbol } from "../types.js";
import { createParser, languageForPath, loadQuerySource, type SyntaxNode } from "./languages.js";
import {
  argumentNodes,
  callee,
  containsJsx,
  enclosingClassName,
  fieldText,
  isExported,
  lineRange,
  objectKeys,
  signatureOf,
  stringLiteral,
} from "./nodes.js";
import {
  isFeatureFlagCall,
  isNextApiRoute,
  isRouteCall,
  isRouteHandlerExport,
  isZodSchemaCall,
  looksLikeComponentName,
  nextAppRouterPath,
  nextPagesRouterPath,
} from "./frameworks.js";

interface Collector {
  symbols: ParsedSymbol[];
  detectors: Set<string>;
  /** Node ids already turned into a symbol, so nothing is reported twice. */
  claimed: Set<number>;
}

export async function parseCodeSymbols(path: string, content: string): Promise<ParsedFile> {
  const language = languageForPath(path);
  if (!language) return { symbols: [], detectors: [] };

  const parser = await createParser(language);
  const source = await loadQuerySource(language, "symbols");
  const tree = parser.parse(content);
  const query = (await parser.getLanguage()).query(source);

  const collector: Collector = { symbols: [], detectors: new Set(), claimed: new Set() };
  const captures = query.captures(tree.rootNode);

  // Calls first: a route registration claims its inline handler, so the
  // handler is not also reported as a bare function.
  for (const capture of captures) {
    if (capture.name === "call") visitCall(path, capture.node, collector);
    if (capture.name === "env_read") visitEnvRead(capture.node, collector);
  }

  for (const capture of captures) {
    if (capture.name === "function" || capture.name === "const_function") {
      visitFunction(path, capture.node, collector);
    }
    if (capture.name === "method") visitMethod(capture.node, collector);
  }

  collector.symbols.sort((a, b) => a.lineStart - b.lineStart || a.name.localeCompare(b.name));

  return { symbols: collector.symbols, detectors: [...collector.detectors].sort() };
}

function push(
  collector: Collector,
  node: SyntaxNode,
  detector: string,
  symbol: Omit<ParsedSymbol, "lineStart" | "lineEnd">,
): void {
  collector.claimed.add(node.id);
  collector.detectors.add(detector);
  collector.symbols.push({ ...symbol, ...lineRange(node) });
}

function visitCall(path: string, node: SyntaxNode, collector: Collector): void {
  const { object, property, name } = callee(node);
  const args = argumentNodes(node);

  if (isRouteCall(object, property) && args.length >= 1) {
    const routePath = stringLiteral(args[0]);
    if (routePath !== undefined) {
      // The handler argument belongs to the route, not to the file at large.
      for (const arg of args.slice(1)) collector.claimed.add(arg.id);

      push(collector, node, "express_route", {
        kind: "route",
        name: `${property?.toUpperCase()} ${routePath}`,
        signature: signatureOf(node, 120),
        meta: { method: property?.toUpperCase(), path: routePath, framework: "express" },
      });
      return;
    }
  }

  if (object === "fastify" && property === "route" && args[0]?.type === "object") {
    const fields = objectKeys(args[0]);
    push(collector, node, "fastify_route", {
      kind: "route",
      name: `fastify.route ${fields.includes("url") ? "" : ""}`.trim() || "fastify.route",
      signature: signatureOf(node, 120),
      meta: { framework: "fastify", fields },
    });
    return;
  }

  if (isZodSchemaCall(object, property)) {
    const declarator = enclosingDeclaratorName(node);
    if (declarator) {
      push(collector, node, "zod_schema", {
        kind: "schema",
        name: declarator,
        signature: signatureOf(node, 120),
        meta: { library: "zod", fields: objectKeys(args[0]) },
      });
    }
    return;
  }

  const calleeText = name ?? (object && property ? `${object}.${property}` : undefined);
  if (calleeText && isFeatureFlagCall(calleeText)) {
    push(collector, node, "feature_flag", {
      kind: "flag",
      name: stringLiteral(args[0]) ?? calleeText,
      signature: signatureOf(node, 120),
      meta: { key: stringLiteral(args[0]) ?? null, via: calleeText },
    });
  }
}

function visitEnvRead(node: SyntaxNode, collector: Collector): void {
  const object = node.childForFieldName("object");
  if (object?.text !== "process.env") return;

  const name = node.childForFieldName("property")?.text;
  if (!name) return;

  push(collector, node, "env_read", {
    kind: "env_read",
    name,
    signature: node.text,
    meta: { variable: name },
  });
}

function visitFunction(path: string, node: SyntaxNode, collector: Collector): void {
  if (collector.claimed.has(node.id)) return;

  const declarator = node.type === "variable_declarator" ? node : undefined;
  const target = declarator?.childForFieldName("value") ?? node;
  const name = declarator ? fieldText(declarator, "name") : fieldText(node, "name");
  if (!name) return;
  if (collector.claimed.has(target.id)) return;

  const exported = isExported(node);
  const jsx = containsJsx(target);

  const appPath = nextAppRouterPath(path);
  const pagesPath = nextPagesRouterPath(path);

  if (appPath !== undefined && isNextApiRoute(path) && isRouteHandlerExport(name)) {
    push(collector, node, "next_app_route", {
      kind: "route",
      name: `${name} ${appPath}`,
      signature: signatureOf(target),
      meta: { method: name, path: appPath, framework: "next-app-router" },
    });
    return;
  }

  if (appPath !== undefined && !isNextApiRoute(path) && exported) {
    push(collector, node, "next_app_page", {
      kind: "page",
      name,
      signature: signatureOf(target),
      meta: { path: appPath, framework: "next-app-router", props: parameterNames(target) },
    });
    return;
  }

  if (pagesPath !== undefined && exported) {
    push(collector, node, isNextApiRoute(path) ? "next_api_route" : "next_page", {
      kind: isNextApiRoute(path) ? "route" : "page",
      name,
      signature: signatureOf(target),
      meta: { path: pagesPath, framework: "next-pages-router" },
    });
    return;
  }

  if (jsx && looksLikeComponentName(name)) {
    push(collector, node, "react_component", {
      kind: "component",
      name,
      signature: signatureOf(target),
      meta: { props: parameterNames(target), exported },
    });
    return;
  }

  push(collector, node, "function", {
    kind: "handler",
    name,
    signature: signatureOf(target),
    meta: { exported },
  });
}

function visitMethod(node: SyntaxNode, collector: Collector): void {
  if (collector.claimed.has(node.id)) return;

  const name = fieldText(node, "name");
  if (!name) return;

  const className = enclosingClassName(node);

  push(collector, node, "class_method", {
    kind: "handler",
    name: className ? `${className}.${name}` : name,
    signature: signatureOf(node),
    meta: { class: className ?? null },
  });
}

function parameterNames(node: SyntaxNode): string[] {
  const params = node.childForFieldName("parameters");
  if (!params) return [];

  return params.namedChildren.flatMap((child) => {
    if (!child) return [];
    const pattern = child.childForFieldName("pattern") ?? child;
    // `{ product }: Props` destructures into the prop names.
    if (pattern.type === "object_pattern") return objectPatternNames(pattern);
    return pattern.type === "identifier" ? [pattern.text] : [];
  });
}

function objectPatternNames(node: SyntaxNode): string[] {
  return node.namedChildren.flatMap((child) => {
    if (!child) return [];
    if (child.type === "shorthand_property_identifier_pattern") return [child.text];
    if (child.type === "pair_pattern") {
      const key = child.childForFieldName("key");
      return key ? [key.text] : [];
    }
    return [];
  });
}

function enclosingDeclaratorName(node: SyntaxNode): string | undefined {
  let current: SyntaxNode | null = node.parent;

  for (let depth = 0; current && depth < 3; depth += 1) {
    if (current.type === "variable_declarator") return current.childForFieldName("name")?.text;
    current = current.parent;
  }

  return undefined;
}

export const SYMBOL_KINDS_WITH_CHUNKS: SymbolKind[] = [
  "route",
  "page",
  "component",
  "handler",
  "model",
  "schema",
  "test",
];
