"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password: form.get("password") }),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Could not reset your password.");
      return;
    }

    router.push("/login");
  }

  if (!token) {
    return (
      <main>
        <p data-testid="reset-invalid">That reset link is not valid. Request a new one.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Choose a new password</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" required minLength={8} />
        {error ? <p data-testid="reset-error">{error}</p> : null}
        <button type="submit">Save password</button>
      </form>
    </main>
  );
}
