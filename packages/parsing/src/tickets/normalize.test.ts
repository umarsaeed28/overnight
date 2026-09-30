import { describe, expect, it } from "vitest";
import { normalizeTicket } from "./normalize.js";

const META = {
  key: "SHOP-103",
  summary: "Password minimum length is inconsistent",
  type: "Bug",
  status: "Open",
  labels: ["auth", "security"],
  epic: "Accounts",
  description: "Our security page says 12 characters. Signup accepts 8.",
  acceptanceCriteria: ["Signup rejects passwords under 12 characters.", "Reset applies the rule."],
  links: [{ relation: "blocks", key: "SHOP-104" }],
};

describe("normalizeTicket", () => {
  it("renders the section 10.4 shape", () => {
    expect(normalizeTicket(META)).toBe(
      [
        "# SHOP-103: Password minimum length is inconsistent",
        "Type: Bug | Status: Open | Labels: auth, security | Epic: Accounts",
        "## Description",
        "Our security page says 12 characters. Signup accepts 8.",
        "## Acceptance criteria",
        "- Signup rejects passwords under 12 characters.",
        "- Reset applies the rule.",
        "## Links",
        "- blocks SHOP-104",
      ].join("\n"),
    );
  });

  it("says none rather than leaving a header dangling", () => {
    const output = normalizeTicket({ key: "SHOP-1", summary: "Bare" });

    expect(output).toContain("Labels: none");
    expect(output).toContain("Epic: none");
    expect(output).toContain("## Description\n_None_");
    expect(output).toContain("## Acceptance criteria\n_None_");
    expect(output).toContain("## Links\n_None_");
  });

  it("requires a key", () => {
    expect(() => normalizeTicket({ summary: "No key" })).toThrow();
  });

  it("is stable for the same input", () => {
    expect(normalizeTicket(META)).toBe(normalizeTicket({ ...META }));
  });
});
