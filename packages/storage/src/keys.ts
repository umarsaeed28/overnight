/**
 * Keys are content addressed under a workspace prefix, so deleting a
 * workspace is a single prefix delete (section 23) and re-fetching unchanged
 * content overwrites itself rather than piling up versions.
 */
export function documentKey(input: {
  workspaceId: string;
  sourceId: string;
  contentHash: string;
}): string {
  return `w/${input.workspaceId}/s/${input.sourceId}/d/${input.contentHash}`;
}

export function workspacePrefix(workspaceId: string): string {
  return `w/${workspaceId}/`;
}

export function sourcePrefix(workspaceId: string, sourceId: string): string {
  return `w/${workspaceId}/s/${sourceId}/`;
}
