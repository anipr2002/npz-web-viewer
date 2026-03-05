import { Polar } from "@convex-dev/polar";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { rateLimiter } from "./rateLimiter";

const PRO_PRODUCT_ID = "08c724e1-1539-4a75-ae66-b10345d0c171";

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

// Rate-limited checkout link generation
export const generateCheckoutLink = action({
  args: {
    origin: v.string(),
    successUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");

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

    const proOrder = orders.find(
      (order) =>
        order.productId === PRO_PRODUCT_ID &&
        (order.status === "paid" || order.billingReason === "purchase"),
    );

    if (!proOrder) return null;

    return {
      amount: proOrder.amount,
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

    return orders.some(
      (order) =>
        order.productId === PRO_PRODUCT_ID &&
        (order.status === "paid" || order.billingReason === "purchase"),
    );
  },
});
