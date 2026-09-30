import { z } from "zod";

/** The fields a ticket connector lifts into `RawItem.meta`. */
export const ticketMetaSchema = z.object({
  key: z.string().min(1),
  summary: z.string().default(""),
  type: z.string().default("Unknown"),
  status: z.string().default("Unknown"),
  labels: z.array(z.string()).default([]),
  epic: z.string().nullable().default(null),
  description: z.string().default(""),
  acceptanceCriteria: z.array(z.string()).default([]),
  links: z.array(z.object({ relation: z.string(), key: z.string() })).default([]),
});
export type TicketMeta = z.infer<typeof ticketMetaSchema>;

const NONE = "_None_";

/**
 * Section 10.4. Every ticket reads the same way whatever it came from, so a
 * citation into a Jira issue and one into an ADO work item look alike.
 */
export function normalizeTicket(meta: unknown): string {
  const ticket = ticketMetaSchema.parse(meta);

  const header = [
    `Type: ${ticket.type}`,
    `Status: ${ticket.status}`,
    `Labels: ${ticket.labels.length > 0 ? ticket.labels.join(", ") : "none"}`,
    `Epic: ${ticket.epic ?? "none"}`,
  ].join(" | ");

  const acceptance =
    ticket.acceptanceCriteria.length > 0
      ? ticket.acceptanceCriteria.map((line) => `- ${line}`).join("\n")
      : NONE;

  const links =
    ticket.links.length > 0
      ? ticket.links.map((link) => `- ${link.relation} ${link.key}`).join("\n")
      : NONE;

  return [
    `# ${ticket.key}: ${ticket.summary}`,
    header,
    "## Description",
    ticket.description.trim() || NONE,
    "## Acceptance criteria",
    acceptance,
    "## Links",
    links,
  ].join("\n");
}
