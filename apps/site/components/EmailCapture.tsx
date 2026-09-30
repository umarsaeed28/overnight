"use client";

import { useId, useState, type FormEvent } from "react";
import { buttonClass } from "./ui/Button";
import { Crane } from "./art/Crane";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const VALIDATION_MESSAGE = "Please enter a valid work email.";
const SUCCESS_MESSAGE = "You are on the list. We will be in touch soon.";
const FAILURE_MESSAGE =
  "Something went wrong. Please try again, or email hello@overnightqa.com";

type Status = "idle" | "sending" | "done" | "failed";

interface EmailCaptureProps {
  /** Recorded against the contact so we know which section converted. */
  section: "hero" | "footer";
  className?: string;
  /** Centred in the final section, left aligned in the hero. */
  align?: "start" | "center";
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      role="presentation"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12 a9 9 0 0 0 -9 -9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmailCapture({ section, className, align = "start" }: EmailCaptureProps) {
  const centred = align === "center";
  const inputId = useId();
  const messageId = useId();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    // Honeypot. A real person never fills this, so a filled one just stops.
    if ((new FormData(form).get("company") as string | null)?.trim()) return;

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(VALIDATION_MESSAGE);
      setStatus("idle");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), section }),
      });

      setStatus(response.ok ? "done" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "done") {
    return (
      <p
        className={`flex items-center gap-3 text-ink ${centred ? "justify-center" : ""} ${className ?? ""}`}
        role="status"
      >
        <Crane className="h-7 w-11 shrink-0" fill="var(--color-matcha)" />
        {SUCCESS_MESSAGE}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={`relative ${className ?? ""}`}>
      <div
        className={`flex w-full flex-col gap-3 sm:flex-row sm:items-center ${centred ? "sm:justify-center" : ""}`}
      >
        <label htmlFor={inputId} className="sr-only">
          Work email
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || status === "failed" ? messageId : undefined}
          className="w-full min-w-0 rounded-full border border-ink/15 bg-white/80 px-6 py-3.5 text-[17px] text-ink placeholder:text-softink/70 sm:w-72"
        />

        {/* Honeypot, kept out of the tab order and away from assistive tech. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          disabled={status === "sending"}
          className={buttonClass("secondary", "shrink-0")}
        >
          {status === "sending" ? <Spinner /> : null}
          Get early access
        </button>
      </div>

      {error ? (
        <p id={messageId} role="alert" className={`mt-3 text-[15px] text-ink ${centred ? "text-center" : ""}`}>
          {error}
        </p>
      ) : null}

      {status === "failed" ? (
        <p id={messageId} role="alert" className={`mt-3 text-[15px] text-ink ${centred ? "text-center" : ""}`}>
          {FAILURE_MESSAGE}
        </p>
      ) : null}
    </form>
  );
}
