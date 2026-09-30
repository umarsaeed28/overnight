/**
 * Thin wrapper around the payment provider. The provider is the only part of
 * checkout this codebase does not own.
 */
export interface ChargeRequest {
  amountCents: number;
  token: string | undefined;
}

export interface ChargeResult {
  ok: boolean;
  providerRef?: string;
  declineReason?: string;
}

const PROVIDER_URL = process.env.PAYMENTS_URL ?? "https://payments.example.com/v1/charges";

export async function chargeCard(request: ChargeRequest): Promise<ChargeResult> {
  if (!request.token) return { ok: false, declineReason: "missing_token" };

  const response = await fetch(PROVIDER_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PAYMENTS_API_KEY ?? ""}`,
    },
    body: JSON.stringify({ amount: request.amountCents, currency: "usd", source: request.token }),
  });

  if (!response.ok) return { ok: false, declineReason: `provider_${response.status}` };

  const body = (await response.json()) as { id: string; status: string };
  return { ok: body.status === "succeeded", providerRef: body.id };
}
