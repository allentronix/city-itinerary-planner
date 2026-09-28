import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

// Guards the Geoapify free tier. Only lookups that miss the cache are counted,
// because cached answers cost nothing.

const USAGE_STORE = "geoapify-usage";

// Stop below Geoapify's free 3,000 credits a day, leaving headroom. Can be
// changed with the GEOAPIFY_DAILY_CREDIT_CAP environment variable.
const DEFAULT_DAILY_CREDIT_CAP = 2500;

// New (uncached) lookups one visitor can trigger per day.
const MAX_LOOKUPS_PER_VISITOR_PER_DAY = 40;

export class UsageLimitError extends Error {}

function getDailyCreditCap(): number {
  const configured = Number(process.env.GEOAPIFY_DAILY_CREDIT_CAP);

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_DAILY_CREDIT_CAP;
}

// Visitors are counted by a hash of their IP address, never the address itself.
function hashVisitor(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// Records a lookup that will cost about `credits`, or throws UsageLimitError
// if it would go over the daily cap or this visitor's allowance.
export async function reserveCredits(
  visitorIp: string,
  credits: number,
): Promise<void> {
  const store = getStore(USAGE_STORE);
  const day = new Date().toISOString().slice(0, 10);

  const creditsKey = `credits-${day}`;
  const visitorsKey = `visitors-${day}`;

  const [usedCredits, visitors] = await Promise.all([
    store.get(creditsKey, { type: "json" }) as Promise<number | null>,
    store.get(visitorsKey, { type: "json" }) as Promise<Record<
      string,
      number
    > | null>,
  ]);

  const creditsSoFar = usedCredits ?? 0;
  const visitorCounts = visitors ?? {};
  const visitor = hashVisitor(visitorIp);
  const visitorLookups = visitorCounts[visitor] ?? 0;

  if (creditsSoFar + credits > getDailyCreditCap()) {
    throw new UsageLimitError(
      "ItiPlanner has reached today's limit for new cities. Please try again tomorrow.",
    );
  }

  if (visitorLookups >= MAX_LOOKUPS_PER_VISITOR_PER_DAY) {
    throw new UsageLimitError(
      "You've looked up a lot of new places today. Please try again tomorrow.",
    );
  }

  visitorCounts[visitor] = visitorLookups + 1;

  // Two small writes per day key; exact counts don't matter, staying well under the limit does.
  await Promise.all([
    store.setJSON(creditsKey, creditsSoFar + credits),
    store.setJSON(visitorsKey, visitorCounts),
  ]);
}
