"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    setPending(false);

    if (response.status === 423) {
      setError("Account locked. Try again later.");
      return;
    }
    if (!response.ok) {
      setError("Email or password is incorrect");
      return;
    }

    router.push(params.get("next") ?? "/orders");
  }

  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />

        {error ? <p data-testid="login-error">{error}</p> : null}

        <button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <a href="/forgot-password">Forgot your password?</a>
    </main>
  );
}
