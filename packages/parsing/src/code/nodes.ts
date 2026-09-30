import type { SyntaxNode } from "./languages.js";

const JSX_TYPES = new Set(["jsx_element", "jsx_self_closing_element", "jsx_fragment"]);

export function lineRange(node: SyntaxNode): { lineStart: number; lineEnd: number } {
  return { lineStart: node.startPosition.row + 1, lineEnd: node.endPosition.row + 1 };
}

export function fieldText(node: SyntaxNode, field: string): string | undefined {
  return node.childForFieldName(field)?.text;
}

/** The declaration line, trimmed of its body, for display in breadcrumbs. */
export function signatureOf(node: SyntaxNode, maxLength = 200): string {
  const body = node.childForFieldName("body");
  const end = body ? body.startIndex - node.startIndex : node.text.length;
  const signature = node.text.slice(0, end).replace(/\s+/g, " ").trim();

  return signature.length > maxLength ? `${signature.slice(0, maxLength - 1)}…` : signature;
}

export function containsJsx(node: SyntaxNode): boolean {
  const stack: SyntaxNode[] = [node];

  while (stack.length > 0) {
    const current = stack.pop() as SyntaxNode;
    if (JSX_TYPES.has(current.type)) return true;
    for (let i = 0; i < current.namedChildCount; i += 1) {
      const child = current.namedChild(i);
      if (child) stack.push(child);
    }
  }

  return false;
}

/** `"/cart"` and `'/cart'` both yield `/cart`; template literals are skipped. */
export function stringLiteral(node: SyntaxNode | null | undefined): string | undefined {
  if (!node) return undefined;

  if (node.type === "string") {
    const fragment = node.namedChildren.find((child) => child?.type === "string_fragment");
    return fragment?.text ?? node.text.slice(1, -1);
  }

  if (node.type === "template_string" && node.namedChildren.length === 0) {
    return node.text.slice(1, -1);
  }

  return undefined;
}

/** Every string literal below a node, in source order. */
export function stringLiteralsWithin(node: SyntaxNode): string[] {
  const found: string[] = [];
  const stack: SyntaxNode[] = [node];

  while (stack.length > 0) {
    const current = stack.pop() as SyntaxNode;
    const literal = stringLiteral(current);
    if (literal !== undefined) found.push(literal);

    for (let i = current.namedChildCount - 1; i >= 0; i -= 1) {
      const child = current.namedChild(i);
      if (child) stack.push(child);
    }
  }

  return found;
}

export function callee(node: SyntaxNode): { object?: string; property?: string; name?: string } {
  const fn = node.childForFieldName("function");
  if (!fn) return {};

  if (fn.type === "member_expression") {
    return {
      object: fn.childForFieldName("object")?.text,
      property: fn.childForFieldName("property")?.text,
    };
  }

  return { name: fn.text };
}

export function argumentNodes(node: SyntaxNode): SyntaxNode[] {
  const args = node.childForFieldName("arguments");
  if (!args) return [];

  return args.namedChildren.filter((child): child is SyntaxNode => Boolean(child));
}

/** Keys of an object literal, used for schema and prop field lists. */
export function objectKeys(node: SyntaxNode | undefined): string[] {
  if (!node || node.type !== "object") return [];

  return node.namedChildren.flatMap((child) => {
    if (!child) return [];
    if (child.type !== "pair" && child.type !== "shorthand_property_identifier") return [];

    const key = child.type === "pair" ? child.childForFieldName("key") : child;
    if (!key) return [];

    return [stringLiteral(key) ?? key.text];
  });
}

export function isExported(node: SyntaxNode): boolean {
  let current: SyntaxNode | null = node;

  // A `const` arrow function sits inside a declarator inside a declaration.
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (current.type === "export_statement") return true;
    current = current.parent;
  }

  return false;
}

export function enclosingClassName(node: SyntaxNode): string | undefined {
  let current: SyntaxNode | null = node.parent;

  while (current) {
    if (current.type === "class_declaration" || current.type === "class") {
      return current.childForFieldName("name")?.text;
    }
    current = current.parent;
  }

  return undefined;
}
