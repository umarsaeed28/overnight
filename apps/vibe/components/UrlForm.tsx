"use client";

import { SubmitUrl } from "@oqa/contracts";
import { Tick } from "@oqa/ui";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Led } from "./Ornaments";

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "success" };

export function UrlForm() {
  const router = useRouter();
  const inputId = useId();
  const messageId = useId();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Read the field itself: text typed before hydration never reached state.
    const submitted = new FormData(event.currentTarget).get("url");
    const parsed = SubmitUrl.safeParse(typeof submitted === "string" ? submitted : value);
    if (!parsed.success) {
      setStatus({
        kind: "error",
        message: parsed.error.issues[0]?.message ?? "That link didn't work. Try again.",
      });
      return;
    }
    setStatus({ kind: "success" });
    // Submission is a stub for now: hand the sanitised URL to the onboarding page.
    router.push(`/onboarding?url=${encodeURIComponent(parsed.data)}`);
  }

  const invalid = status.kind === "error";

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 max-w-xl" id="try">
      <label htmlFor={inputId} className="sr-only">
        Link to your app
      </label>
      {/* A slot pressed into the surface, with the Go key sitting in it. The edge keeps it findable (3:1). */}
      <div className="nm-inset border-edge flex items-center gap-2 border p-2 [--r:1.25rem]">
        <input
          id={inputId}
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (status.kind !== "idle") setStatus({ kind: "idle" });
          }}
          placeholder="yourapp.vercel.app"
          aria-invalid={invalid}
          aria-describedby={messageId}
          className="text-ink placeholder:text-ink-soft min-h-14 min-w-0 flex-1 rounded-xl bg-transparent px-4 text-xl font-normal outline-offset-2"
        />
        <button
          type="submit"
          className="nm-key nm-press min-h-14 shrink-0 px-9 text-lg font-medium [--r:0.9rem]"
        >
          Go
        </button>
      </div>
      <p id={messageId} role="status" aria-live="polite" className="mt-4 min-h-10">
        {status.kind === "error" && (
          <span className="nm-inset-sm inline-flex items-center gap-3 py-2 pl-4 pr-5 text-base [--r:999px]">
            <Led tone="rose" />
            {status.message}
          </span>
        )}
        {status.kind === "success" && (
          <span className="nm-inset-sm inline-flex items-center gap-3 py-2 pl-4 pr-5 text-base [--r:999px]">
            <Tick className="text-pass h-5 w-5" />
            Looks good. Taking you to setup…
          </span>
        )}
      </p>
    </form>
  );
}
