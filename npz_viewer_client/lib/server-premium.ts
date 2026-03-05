import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export interface PremiumCheckResult {
  isPremium: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

/**
 * Check if the current user is premium from server-side.
 * Used in Next.js API routes to enforce premium feature access.
 */
export async function checkPremiumStatus(): Promise<PremiumCheckResult> {
  const { userId, getToken } = await auth();

  if (!userId) {
    return {
      isPremium: false,
      isAuthenticated: false,
      userId: null,
    };
  }

  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL not configured");
    return {
      isPremium: false,
      isAuthenticated: true,
      userId,
    };
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    
    // Get the Clerk JWT token to authenticate with Convex
    const token = await getToken();
    if (token) {
      client.setAuth(token);
    }

    const isPremium = await client.query(api.polar.isPremium, {});
    return {
      isPremium: isPremium ?? false,
      isAuthenticated: true,
      userId,
    };
  } catch (error) {
    console.error("Error checking premium status:", error);
    return {
      isPremium: false,
      isAuthenticated: true,
      userId,
    };
  }
}

/**
 * Check rate limit from server-side.
 * Used in Next.js API routes to enforce rate limiting.
 */
export async function checkRateLimit(
  endpoint: "clustering" | "dimensionalityReduction" | "revenue"
): Promise<{ ok: boolean; retryAfter?: number }> {
  const { userId, getToken } = await auth();

  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL not configured");
    return { ok: true };
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    
    const token = await getToken();
    if (token) {
      client.setAuth(token);
    }

    const result = await client.mutation(api.rateLimiter.checkApiRateLimit, {
      endpoint,
      userId: userId ?? undefined,
    });
    
    return {
      ok: result.ok,
      retryAfter: result.retryAfter,
    };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return { ok: true };
  }
}

/**
 * Require rate limit - returns error response if rate limited.
 * Use this in API route handlers.
 */
export async function requireRateLimit(
  endpoint: "clustering" | "dimensionalityReduction" | "revenue"
): Promise<void | Response> {
  const result = await checkRateLimit(endpoint);

  if (!result.ok) {
    const retryAfterSeconds = Math.ceil((result.retryAfter ?? 60000) / 1000);
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        code: "RATE_LIMITED",
        retryAfter: retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfterSeconds.toString(),
        },
      }
    );
  }
}

/**
 * Require premium access - returns error response if not premium.
 * Use this in API route handlers.
 */
export async function requirePremium(): Promise<{ userId: string } | Response> {
  const result = await checkPremiumStatus();

  if (!result.isAuthenticated) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!result.isPremium) {
    return new Response(
      JSON.stringify({
        error: "Premium subscription required for this feature",
        code: "PREMIUM_REQUIRED",
      }),
      {
        status: 402,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return { userId: result.userId! };
}
