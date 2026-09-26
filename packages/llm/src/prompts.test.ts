import { readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { loadPrompt, parsePrompt, PROMPTS_DIR, renderPrompt } from "./prompts.js";

const valid = `---
id: extract
version: 3
model_role: EXTRACT
max_input_tokens: 80000
max_tokens: 8000
---
Body line one.
`;

describe("parsePrompt", () => {
  it("reads frontmatter and body", () => {
    const prompt = parsePrompt(valid, "extract");
    expect(prompt).toMatchObject({
      id: "extract",
      version: 3,
      versionTag: "extract@3",
      modelRole: "EXTRACT",
      maxInputTokens: 80_000,
      maxTokens: 8000,
    });
    expect(prompt.body).toBe("Body line one.\n");
  });

  it("rejects a prompt with no version, so nothing unversioned reaches the API", () => {
    const source = valid.replace("version: 3\n", "");
    expect(() => parsePrompt(source)).toThrow(/version/);
  });

  it("rejects an unknown model role", () => {
    expect(() => parsePrompt(valid.replace("EXTRACT", "TURBO"))).toThrow(/model_role/);
  });

  it("rejects a file whose id does not match its name", () => {
    expect(() => parsePrompt(valid, "entail")).toThrow(/declares id "extract"/);
  });

  it("rejects an empty body", () => {
    expect(() => parsePrompt(valid.replace("Body line one.\n", ""))).toThrow(/no body/);
  });

  it("rejects missing frontmatter", () => {
    expect(() => parsePrompt("Just a prompt with no frontmatter")).toThrow(/frontmatter/);
  });
});

describe("renderPrompt", () => {
  it("fills placeholders", () => {
    expect(renderPrompt("Produce {{count}} cases for {{focus}}.", { count: 5, focus: "negative" })).toBe(
      "Produce 5 cases for negative.",
    );
  });

  it("throws rather than shipping a literal placeholder to the model", () => {
    expect(() => renderPrompt("Produce {{count}} cases.")).toThrow(/missing values for: count/);
  });

  it("leaves a prompt with no placeholders untouched", () => {
    expect(renderPrompt("No placeholders here.")).toBe("No placeholders here.");
  });
});

describe("the prompts directory", () => {
  it("every prompt file parses, and its id matches its filename", async () => {
    const files = (await readdir(PROMPTS_DIR)).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const id = file.replace(/\.md$/, "");
      const prompt = await loadPrompt(id);
      expect(prompt.id).toBe(id);
      expect(prompt.maxTokens).toBeGreaterThan(0);
    }
  });
});
