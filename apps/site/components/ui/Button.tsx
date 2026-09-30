import type { ButtonHTMLAttributes } from "react";

export type ButtonTone = "primary" | "secondary";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[17px] font-medium " +
  "transition duration-200 ease-out will-change-transform " +
  "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none " +
  "motion-reduce:transform-none motion-reduce:transition-none";

const tones: Record<ButtonTone, string> = {
  primary: "bg-ink text-washi",
  secondary: "bg-sakura text-ink",
};

export function buttonClass(tone: ButtonTone = "primary", extra?: string): string {
  return [base, tones[tone], extra].filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
}

export function Button({ tone = "primary", className, ...props }: ButtonProps) {
  return <button {...props} className={buttonClass(tone, className)} />;
}
