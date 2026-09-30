/**
 * Section 23: connectors are read-only. A configuration that asks for write
 * access is rejected at validation time rather than trusted not to use it.
 */
const WRITE_MARKERS = [
  "write",
  "admin",
  "manage",
  "delete",
  "push",
  "create",
  "update",
  "modify",
  "full_control",
  "readwrite",
];

export class WriteScopeError extends Error {
  constructor(readonly scopes: string[]) {
    super(
      `This source asks for write access (${scopes.join(", ")}). Overnight QA only connects read-only.`,
    );
    this.name = "WriteScopeError";
  }
}

export function findWriteScopes(scopes: readonly string[]): string[] {
  return scopes.filter((scope) => {
    const normalized = scope.toLowerCase();
    // `read:write-protection` style scopes are still read-only.
    if (normalized.startsWith("read:") || normalized.startsWith("read.")) return false;
    return WRITE_MARKERS.some((marker) => normalized.includes(marker));
  });
}

export function assertReadOnlyScopes(scopes: readonly string[]): void {
  const offending = findWriteScopes(scopes);
  if (offending.length > 0) throw new WriteScopeError(offending);
}

/**
 * GitHub App installation permissions, as `{ contents: "read" }`. Anything
 * other than `read` on any permission is a write grant.
 */
export function assertReadOnlyPermissions(permissions: Record<string, string>): void {
  const offending = Object.entries(permissions)
    .filter(([, level]) => level.toLowerCase() !== "read")
    .map(([name, level]) => `${name}:${level}`);

  if (offending.length > 0) throw new WriteScopeError(offending);
}
