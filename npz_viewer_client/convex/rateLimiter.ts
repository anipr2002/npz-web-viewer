import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Checkout rate limit: 5 checkout attempts per user per hour
  checkout: { kind: "token bucket", rate: 5, period: HOUR, capacity: 2 },
  // ML API rate limits: 20 requests per user per minute
  clustering: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
  dimensionalityReduction: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },
  // Revenue API: 60 requests per minute globally (it's a public endpoint)
  revenue: { kind: "fixed window", rate: 60, period: MINUTE },
});

// Mutation to check rate limit for API routes (called from Next.js server-side)
export const checkApiRateLimit = mutation({
  args: {
    endpoint: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let key = args.userId;

    // For endpoints that require user context, get the current user
    if (!key && (args.endpoint === "clustering" || args.endpoint === "dimensionalityReduction")) {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return { ok: false, retryAfter: 0, error: "User not authenticated" };
      }
      key = user.externalId;
    }

    const validEndpoints = ["clustering", "dimensionalityReduction", "revenue"] as const;
    if (!validEndpoints.includes(args.endpoint as typeof validEndpoints[number])) {
      return { ok: false, retryAfter: 0, error: "Invalid endpoint" };
    }

    const status = await rateLimiter.limit(ctx, args.endpoint as typeof validEndpoints[number], { key });
    return {
      ok: status.ok,
      retryAfter: status.retryAfter ?? 0,
    };
  },
});
