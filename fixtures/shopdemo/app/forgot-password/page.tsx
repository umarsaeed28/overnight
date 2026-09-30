"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });

    // Always the same confirmation, whether or not the address has an account.
    setSent(true);
  }

  return (
    <main>
      <h1>Reset your password</h1>

      {sent ? (
        <p data-testid="reset-sent">
          If that email has an account, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
          <button type="submit">Send reset link</button>
        </form>
      )}
    </main>
  );
}
