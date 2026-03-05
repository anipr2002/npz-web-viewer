import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    userId: v.id("users"),
  }).index("byUserId", ["userId"]),
  users: defineTable({
    name: v.string(),
    // this the Clerk ID, stored in the subject JWT field
    externalId: v.string(),
  }).index("byExternalId", ["externalId"]),
  orders: defineTable({
    polarOrderId: v.string(),
    polarCustomerId: v.string(),
    productId: v.string(),
    status: v.string(),
    billingReason: v.string(),
    amount: v.number(),
    currency: v.string(),
    createdAt: v.string(),
  })
    .index("byPolarOrderId", ["polarOrderId"])
    .index("byPolarCustomerId", ["polarCustomerId"]),
});
