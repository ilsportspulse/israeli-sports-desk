import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { readData, writeData } from "@/lib/admin/persist";

export const runtime = "nodejs";

// Partnership / sponsorship enquiries. Heavily spam-filtered because a public
// form on a new domain is a magnet: honeypot + time-trap + rate-limit + content
// heuristics + a blocklist all have to pass before a lead is stored. Genuine
// enquiries are appended to data/partner-leads.json (committed, so they surface
// in the repo/backoffice); Patrick also gets the address partnership@ on the page.

const LEADS_REL = "data/partner-leads.json";
const MAX = { name: 120, org: 160, email: 160, message: 4000 };
const MIN_MESSAGE = 20;
const MIN_FILL_MS = 4000; // a human takes at least a few seconds
const MAX_LINKS = 2;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 3; // per IP per hour

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BLOCKLIST = [
  "seo service", "guest post", "backlink", "link building", "casino", "crypto", "bitcoin",
  "forex", "loan offer", "viagra", "escort", "porn", "betting affiliate", "rank your",
  "web design service", "increase traffic", "buy followers", "dofollow",
];

const TYPES = new Set(["partnership", "sponsorship", "media-licence", "other"]);

type Lead = {
  receivedAt: string;
  type: string;
  name: string;
  org: string;
  email: string;
  message: string;
};

const hits = new Map<string, number[]>();

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_MAX;
}

export async function POST(req: NextRequest) {
  if (rateLimited(clientKey(req))) {
    return NextResponse.json({ error: "Too many enquiries from this connection. Please try again later, or email partnership@ilsportspulse.com." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // 1. Honeypot — a hidden field only a bot fills.
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return NextResponse.json({ ok: true }); // silently accept, store nothing
  }
  // 2. Time-trap — form must have been on screen for a human moment.
  const renderedAt = Number(body.renderedAt);
  if (!Number.isFinite(renderedAt) || Date.now() - renderedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true }); // looks automated; drop silently
  }

  const type = String(body.type ?? "").trim();
  const name = String(body.name ?? "").trim();
  const org = String(body.org ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();

  // 3. Field validation.
  if (!TYPES.has(type)) return NextResponse.json({ error: "Please choose what your enquiry is about." }, { status: 400 });
  if (name.length < 2 || name.length > MAX.name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (org.length > MAX.org) return NextResponse.json({ error: "Organisation name is too long." }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > MAX.email) return NextResponse.json({ error: "Please enter a valid e-mail address." }, { status: 400 });
  if (message.length < MIN_MESSAGE) return NextResponse.json({ error: `Please tell us a little more (at least ${MIN_MESSAGE} characters).` }, { status: 400 });
  if (message.length > MAX.message) return NextResponse.json({ error: "Message is too long." }, { status: 400 });

  // 4. Content heuristics — link flood + blocklist + non-text ratio.
  const linkCount = (message.match(/https?:\/\/|www\./gi) ?? []).length;
  if (linkCount > MAX_LINKS) return NextResponse.json({ error: "Please describe your proposal in words rather than links; we'll ask for materials by reply." }, { status: 400 });
  const haystack = `${name} ${org} ${message}`.toLowerCase();
  if (BLOCKLIST.some((term) => haystack.includes(term))) {
    return NextResponse.json({ ok: true }); // spam signature; drop silently
  }
  const letters = (message.match(/[a-zA-Z֐-׿]/g) ?? []).length;
  if (letters / message.length < 0.5) return NextResponse.json({ error: "That message doesn't look like readable text." }, { status: 400 });

  // Passed every filter — store the lead.
  const lead: Lead = { receivedAt: new Date().toISOString(), type, name, org, email, message };
  try {
    const store = await readData<{ leads: Lead[] }>(LEADS_REL, { leads: [] });
    store.leads.unshift(lead);
    await writeData(LEADS_REL, store, { actor: "partner-form", message: `chore(leads): partnership enquiry from ${org || name}` });
  } catch {
    // Never lose a genuine lead to a storage hiccup — tell them the direct route.
    return NextResponse.json({ error: "We couldn't save your message just now. Please e-mail partnership@ilsportspulse.com directly." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
