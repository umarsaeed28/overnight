"use client";

import { useCallback, useState } from "react";
import { buttonClass, type ButtonTone } from "./ui/Button";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
const STYLESHEET_HREF = "https://assets.calendly.com/assets/external/widget.css";

interface CalendlyWidget {
  initPopupWidget: (options: { url: string }) => void;
}

declare global {
  interface Window {
    Calendly?: CalendlyWidget;
  }
}

/** Forward any campaign parameters already on the page to the booking form. */
function withUtmParameters(base: string): string {
  if (typeof window === "undefined") return base;

  try {
    const target = new URL(base);
    const current = new URLSearchParams(window.location.search);

    for (const [key, value] of current) {
      if (key.startsWith("utm_")) target.searchParams.set(key, value);
    }

    return target.toString();
  } catch {
    return base;
  }
}

/** Loaded on first click only, so it costs nothing on page load. */
function loadCalendly(): Promise<void> {
  if (window.Calendly) return Promise.resolve();

  if (!document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = STYLESHEET_HREF;
    document.head.appendChild(stylesheet);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("calendly")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("calendly"));
    document.head.appendChild(script);
  });
}

interface DemoButtonProps {
  children: string;
  tone?: ButtonTone;
  className?: string;
  /** A plain text link, for the footer where a pill would be too loud. */
  variant?: "pill" | "link";
}

export function DemoButton({
  children,
  tone = "primary",
  className,
  variant = "pill",
}: DemoButtonProps) {
  const [busy, setBusy] = useState(false);
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com";

  const open = useCallback(async () => {
    const url = withUtmParameters(calendlyUrl);
    setBusy(true);

    try {
      await loadCalendly();
      if (!window.Calendly) throw new Error("calendly");
      window.Calendly.initPopupWidget({ url });
    } catch {
      // The booking page still works on its own if the widget cannot load.
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }, [calendlyUrl]);

  const classes =
    variant === "link"
      ? `rounded-full text-softink underline decoration-ink/20 underline-offset-4 hover:text-ink ${className ?? ""}`
      : buttonClass(tone, className);

  return (
    <button type="button" onClick={open} aria-busy={busy} className={classes}>
      {children}
    </button>
  );
}
