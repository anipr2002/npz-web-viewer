import { NextResponse } from "next/server";
import { requireRateLimit } from "@/lib/server-premium";

// Cache results for 5 minutes
let cached: { bmac: number; fetchedAt: number } | null = null;
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

export async function GET() {
  // Check rate limit first
  const rateLimitResponse = await requireRateLimit("revenue");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const now = Date.now();
    if (cached && now - cached.fetchedAt < CACHE_TTL) {
      return NextResponse.json(
        { bmac: cached.bmac },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    const bmac = await fetchBmacTotal();

    cached = { bmac, fetchedAt: now };

    return NextResponse.json(
      { bmac },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    return NextResponse.json({ bmac: 0 });
  }
}
