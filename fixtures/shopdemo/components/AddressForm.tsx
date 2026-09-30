"use client";

import { useState } from "react";

export function AddressForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(form: FormData) {
    const next: Record<string, string> = {};
    if (!String(form.get("name") ?? "").trim()) next.name = "Enter a name";
    if (!String(form.get("line1") ?? "").trim()) next.line1 = "Enter an address";
    if (!String(form.get("city") ?? "").trim()) next.city = "Enter a city";
    if (String(form.get("postcode") ?? "").trim().length < 3) next.postcode = "Enter a postcode";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <form
      data-testid="address-form"
      onSubmit={(event) => {
        if (!validate(new FormData(event.currentTarget))) event.preventDefault();
      }}
    >
      <h2>Shipping address</h2>

      <label htmlFor="name">Full name</label>
      <input id="name" name="name" required />
      {errors.name ? <p role="alert">{errors.name}</p> : null}

      <label htmlFor="line1">Address</label>
      <input id="line1" name="line1" required />
      {errors.line1 ? <p role="alert">{errors.line1}</p> : null}

      <label htmlFor="city">City</label>
      <input id="city" name="city" required />
      {errors.city ? <p role="alert">{errors.city}</p> : null}

      <label htmlFor="postcode">Postcode</label>
      <input id="postcode" name="postcode" required />
      {errors.postcode ? <p role="alert">{errors.postcode}</p> : null}

      <label htmlFor="phone">Phone (optional)</label>
      <input id="phone" name="phone" type="tel" />
    </form>
  );
}
