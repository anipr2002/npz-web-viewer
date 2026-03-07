import type { Doc } from "./_generated/dataModel";

export const PRO_PRODUCT_ID = "08c724e1-1539-4a75-ae66-b10345d0c171";

const NON_BLOCKING_PRO_ORDER_STATUSES = new Set([
  "cancelled",
  "expired",
  "refunded",
]);

export function isProOrder(order: Pick<Doc<"orders">, "productId">) {
  return order.productId === PRO_PRODUCT_ID;
}

export function isPaidProOrder(
  order: Pick<Doc<"orders">, "productId" | "status">,
) {
  return isProOrder(order) && order.status === "paid";
}

export function getPaidProOrderAmountCents(
  order: Pick<Doc<"orders">, "amount" | "productId" | "status">,
) {
  if (!isPaidProOrder(order)) {
    return 0;
  }

  return order.amount;
}

export function getPolarOrderAmountCents(order: {
  totalAmount: number;
  subtotalAmount: number;
  netAmount: number;
  taxAmount: number;
  items: Array<{ amount: number; taxAmount: number }>;
}) {
  const itemTotal = order.items.reduce(
    (sum, item) => sum + item.amount + item.taxAmount,
    0,
  );

  return Math.max(
    order.totalAmount,
    order.netAmount + order.taxAmount,
    order.subtotalAmount + order.taxAmount,
    itemTotal,
  );
}

export function blocksNewProCheckout(
  order: Pick<Doc<"orders">, "productId" | "status">,
) {
  return (
    isProOrder(order) &&
    order.status !== "paid" &&
    !NON_BLOCKING_PRO_ORDER_STATUSES.has(order.status)
  );
}
