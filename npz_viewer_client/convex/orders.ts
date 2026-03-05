import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { polar } from "./polar";

export const upsertOrder = internalMutation({
  args: {
    polarOrderId: v.string(),
    polarCustomerId: v.string(),
    productId: v.string(),
    status: v.string(),
    billingReason: v.string(),
    amount: v.number(),
    currency: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("orders")
      .withIndex("byPolarOrderId", (q) => q.eq("polarOrderId", args.polarOrderId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("orders", args);
    }
  },
});

export const getOrdersByCustomerId = query({
  args: { polarCustomerId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized: User not authenticated");
    }

    // Verify the caller owns this customer ID
    const customer = await polar.getCustomerByUserId(ctx, user.externalId);
    if (!customer || customer.id !== args.polarCustomerId) {
      throw new Error("Forbidden: You don't have access to these orders");
    }

    return await ctx.db
      .query("orders")
      .withIndex("byPolarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId),
      )
      .collect();
  },
});

export const getTotalRevenue = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .collect();

    const total = orders
      .filter((o) => o.status === "paid" || o.billingReason === "purchase")
      .reduce((sum, o) => sum + o.amount, 0);

    // amount is in cents
    return total;
  },
});
