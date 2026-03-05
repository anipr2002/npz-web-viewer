import { NextResponse } from "next/server";
import { requireRateLimit } from "@/lib/server-premium";

// Cache results for 5 minutes
let cached: { bmac: number; polar: number; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchBmacTotal(): Promise<number> {
  const token = process.env.BMAC_ACCESS_TOKEN;
  if (!token) return 0;

  let total = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `https://developers.buymeacoffee.com/api/v1/supporters?page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) break;

    const data = await res.json();
    for (const s of data.data ?? []) {
      if (s.is_refunded === "1") continue;
      total +=
        (s.support_coffees ?? 0) * parseFloat(s.support_coffee_price ?? "0");
    }

    hasMore = !!data.next_page_url;
    page++;
  }

  return total;
}

async function fetchPolarTotal(): Promise<number> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) return 0;

  const res = await fetch(
    `https://api.polar.sh/v1/metrics?start_date=2024-01-01&end_date=${new Date().toISOString().split("T")[0]}&interval=year`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!res.ok) return 0;

  const data = await res.json();
  // revenue is in cents
  return (data.totals?.revenue ?? 0) / 100;
}

export async function GET() {
  // Check rate limit first
  const rateLimitResponse = await requireRateLimit('revenue');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const now = Date.now();
    if (cached && now - cached.fetchedAt < CACHE_TTL) {
      return NextResponse.json(
        { bmac: cached.bmac, polar: cached.polar },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    const [bmac, polar] = await Promise.all([
      fetchBmacTotal(),
      fetchPolarTotal(),
    ]);

    cached = { bmac, polar, fetchedAt: now };

    return NextResponse.json(
      { bmac, polar },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    return NextResponse.json({ bmac: 0, polar: 0 });
  }
}
