import { Polar } from "@convex-dev/polar";
import { ordersList } from "@polar-sh/sdk/funcs/ordersList";
import { api, components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query, mutation, action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { rateLimiter } from "./rateLimiter";
import {
  blocksNewProCheckout,
  getPolarOrderAmountCents,
  getPaidProOrderAmountCents,
  isPaidProOrder,
  PRO_PRODUCT_ID,
} from "./premium";

export const polar = new Polar<DataModel, { pro: string }>(components.polar, {
  server: "production",
  products: {
    pro: PRO_PRODUCT_ID,
  },
  getUserInfo: async (ctx) => {
    const identity = await (ctx as any).auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    return {
      userId: identity.subject,
      email: identity.email ?? identity.subject,
    };
  },
});

const {
  getConfiguredProducts,
  generateCustomerPortalUrl,
} = polar.api();

export const getProCheckoutEligibility = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        canCheckout: false,
        reason: "not_authenticated" as const,
      };
    }

    const customer = await polar.getCustomerByUserId(ctx, user.externalId);
    if (!customer) {
      return {
        canCheckout: true,
        reason: "eligible" as const,
      };
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("byPolarCustomerId", (q) => q.eq("polarCustomerId", customer.id))
      .collect();

    if (orders.some(isPaidProOrder)) {
      return {
        canCheckout: false,
        reason: "already_purchased" as const,
      };
    }

    if (orders.some(blocksNewProCheckout)) {
      return {
        canCheckout: false,
        reason: "checkout_pending" as const,
      };
    }

    return {
      canCheckout: true,
      reason: "eligible" as const,
    };
  },
});

// Rate-limited checkout link generation
export const generateCheckoutLink = action({
  args: {
    origin: v.string(),
    successUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");

    const eligibility = await ctx.runQuery(api.polar.getProCheckoutEligibility, {});
    if (!eligibility.canCheckout) {
      if (eligibility.reason === "already_purchased") {
        throw new Error("You already own Pro.");
      }
      if (eligibility.reason === "checkout_pending") {
        throw new Error("You already have a Pro checkout in progress.");
      }
      throw new Error("User not authenticated");
    }

    // Check rate limit (per-user)
    const status = await rateLimiter.limit(ctx, "checkout", {
      key: identity.subject,
    });
    if (!status.ok) {
      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil((status.retryAfter ?? 0) / 1000)} seconds.`);
    }

    const checkout = await polar.createCheckoutSession(ctx, {
      productIds: [PRO_PRODUCT_ID],
      userId: identity.subject,
      email: identity.email ?? identity.subject,
      origin: args.origin,
      successUrl: args.successUrl,
    });

    return { url: checkout.url };
  },
});

export { getConfiguredProducts, generateCustomerPortalUrl };

export const syncProOrdersFromPolar = internalAction({
  args: {},
  handler: async (ctx) => {
    const pages = await ordersList(polar.polar, {
      productId: PRO_PRODUCT_ID,
      limit: 100,
    });

    let synced = 0;

    for await (const page of pages) {
      if (!page.ok) {
        throw page.error;
      }

      for (const order of page.value.result.items) {
        if (!order.productId) continue;

        await ctx.runMutation(internal.orders.upsertOrder, {
          polarOrderId: order.id,
          polarCustomerId: order.customerId,
          productId: order.productId,
          status: order.status,
          billingReason: order.billingReason,
          amount: getPolarOrderAmountCents(order),
          currency: order.currency,
          createdAt: order.createdAt.toISOString(),
        });

        synced += 1;
      }
    }

    return { synced };
  },
});

export const getProOrderDetails = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const customer = await polar.getCustomerByUserId(ctx, user.externalId);
    if (!customer) return null;

    const orders = await ctx.db
      .query("orders")
      .withIndex("byPolarCustomerId", (q) =>
        q.eq("polarCustomerId", customer.id),
      )
      .collect();

    const proOrder = orders
      .filter(isPaidProOrder)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

    if (!proOrder) return null;

    return {
      amount: getPaidProOrderAmountCents(proOrder),
      currency: proOrder.currency,
      purchasedAt: proOrder.createdAt,
      status: proOrder.status,
    };
  },
});

export const isPremium = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    // Check the Polar component's customer record to get the Polar customer ID
    const customer = await polar.getCustomerByUserId(ctx, user.externalId);
    if (!customer) return false;

    // Check our orders table for a paid one-time purchase
    const orders = await ctx.db
      .query("orders")
      .withIndex("byPolarCustomerId", (q) =>
        q.eq("polarCustomerId", customer.id),
      )
      .collect();

    return orders.some(isPaidProOrder);
  },
});
