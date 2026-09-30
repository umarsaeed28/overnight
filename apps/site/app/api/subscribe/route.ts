import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email().max(320),
  section: z.enum(["hero", "footer"]),
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

/**
 * One counter per address, held in memory. Enough for a single page site, and
 * the window is short enough that a restart cannot be exploited meaningfully.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const { email, section } = parsed.data;

  try {
    const result = await new Resend(apiKey).contacts.create({
      audienceId,
      email,
      unsubscribed: false,
      // Resend audience contacts expose only firstName and lastName as
      // writable properties, so lastName carries which section converted and
      // firstName stays free for a real name later.
      lastName: section,
    });

    if (result.error) {
      return NextResponse.json({ error: "provider" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "provider" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
