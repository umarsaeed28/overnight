import { cn } from "@/lib/utils";
import type { ComponentPropsWithRef } from "react";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm",
        "placeholder:text-[var(--muted-foreground)]",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
