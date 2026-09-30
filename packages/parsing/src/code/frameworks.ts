export const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

const ROUTER_RECEIVERS = new Set(["app", "router", "server", "fastify", "api", "r"]);

/** Express, Fastify and Koa all read as `receiver.method("/path", handler)`. */
export function isRouteCall(receiver: string | undefined, property: string | undefined): boolean {
  if (!receiver || !property) return false;
  if (!(HTTP_METHODS as readonly string[]).includes(property.toLowerCase())) return false;

  const root = receiver.split(".")[0] ?? receiver;
  return ROUTER_RECEIVERS.has(root.toLowerCase()) || /router|app|server$/i.test(root);
}

/**
 * Next.js App Router. `app/(shop)/products/[id]/page.tsx` serves
 * `/products/:id`; route groups in parentheses do not appear in the URL.
 */
export function nextAppRouterPath(filePath: string): string | undefined {
  const parts = filePath.split("/");
  const appIndex = parts.lastIndexOf("app");
  if (appIndex === -1) return undefined;

  const file = parts.at(-1) ?? "";
  if (!/^(page|route)\.(t|j)sx?$/.test(file)) return undefined;

  const segments = parts
    .slice(appIndex + 1, -1)
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .map(toUrlSegment);

  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}

/** Next.js Pages Router. `pages/products/[id].tsx` serves `/products/:id`. */
export function nextPagesRouterPath(filePath: string): string | undefined {
  const parts = filePath.split("/");
  const pagesIndex = parts.lastIndexOf("pages");
  if (pagesIndex === -1) return undefined;

  const file = parts.at(-1) ?? "";
  if (!/\.(t|j)sx?$/.test(file)) return undefined;

  const name = file.replace(/\.(t|j)sx?$/, "");
  const segments = [...parts.slice(pagesIndex + 1, -1), ...(name === "index" ? [] : [name])].map(
    toUrlSegment,
  );

  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}

function toUrlSegment(segment: string): string {
  const catchAll = segment.match(/^\[\.\.\.(.+)\]$/);
  if (catchAll) return `*${catchAll[1]}`;

  const dynamic = segment.match(/^\[(.+)\]$/);
  return dynamic ? `:${dynamic[1]}` : segment;
}

export function isNextApiRoute(filePath: string): boolean {
  return /(^|\/)pages\/api\//.test(filePath) || /(^|\/)app\/.*\/route\.(t|j)sx?$/.test(filePath);
}

/** An App Router `route.ts` exports one function per HTTP verb. */
export function isRouteHandlerExport(name: string): boolean {
  return (HTTP_METHODS as readonly string[]).includes(name.toLowerCase()) && name === name.toUpperCase();
}

const DEFAULT_FLAG_PATTERNS = [/^isEnabled$/, /^useFlag$/, /^LaunchDarkly/, /^flags\./];

export function isFeatureFlagCall(
  name: string,
  patterns: readonly RegExp[] = DEFAULT_FLAG_PATTERNS,
): boolean {
  return patterns.some((pattern) => pattern.test(name));
}

export function isZodSchemaCall(object: string | undefined, property: string | undefined): boolean {
  return object === "z" && (property === "object" || property === "enum" || property === "union");
}

/** React components are capitalised by convention and return JSX. */
export function looksLikeComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}
