"use client";

import { Tick } from "@oqa/ui";
import { useState } from "react";

type State = "idle" | "copied" | "failed";

/** A markdown prompt in a shallow recess, with a key that copies it. */
export function CopyPrompt({ filename, text }: { filename: string; text: string }) {
  const [state, setState] = useState<State>("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("failed");
    }
  }

  return (
    <figure className="nm-inset border-line overflow-hidden border [--r:1.25rem]">
      <div className="border-line flex items-center justify-between gap-4 border-b px-5 py-3">
        <figcaption className="text-ink-soft truncate font-mono text-sm">{filename}</figcaption>
        <button
          type="button"
          onClick={copy}
          className="nm-key nm-press inline-flex min-h-10 shrink-0 items-center gap-2 px-5 text-sm font-medium [--r:0.8rem]"
        >
          {state === "copied" && <Tick className="h-4 w-4" />}
          {state === "copied" ? "Copied" : "Copy prompt"}
        </button>
      </div>
      <pre
        tabIndex={0}
        aria-label={`Markdown prompt: ${filename}`}
        className="overflow-x-auto px-5 py-5 text-[0.82rem] leading-relaxed sm:text-sm"
      >
        <code>
          {text.split("\n").map((line, i) => (
            <span
              key={i}
              className={`block whitespace-pre ${line.startsWith("#") ? "text-accent-text font-semibold" : ""}`}
            >
              {line || " "}
            </span>
          ))}
        </code>
      </pre>
      <p role="status" aria-live="polite" className="text-ink-soft border-line min-h-10 border-t px-5 py-2.5 text-sm">
        {state === "copied" && "Copied to your clipboard."}
        {state === "failed" && "Couldn't copy automatically. Select the text and copy it."}
        {state === "idle" && "Paste it into Claude Code, Codex, Cursor or any AI builder."}
      </p>
    </figure>
  );
}
