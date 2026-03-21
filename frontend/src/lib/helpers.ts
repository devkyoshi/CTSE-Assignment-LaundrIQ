import { ORDER_STATUSES, CANCELLED_STATUS } from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

type StatusVariant = NonNullable<BadgeProps["variant"]>;

export function getOrderStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "PENDING": return "pending";
    case "PICKED_UP":
    case "WASHING": return "active";
    case "READY": return "ready";
    case "DELIVERED": return "success";
    case "CANCELLED": return "cancelled";
    default: return "secondary";
  }
}

export function getPaymentStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "PENDING": return "pending";
    case "COMPLETED": return "success";
    case "FAILED": return "cancelled";
    case "REFUNDED": return "active";
    default: return "secondary";
  }
}

export function getNextOrderStatus(current: string): string | null {
  const idx = ORDER_STATUSES.indexOf(current as any);
  if (idx === -1 || idx >= ORDER_STATUSES.length - 1) return null;
  return ORDER_STATUSES[idx + 1];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 2 }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric",
  }).format(new Date(dateStr));
}

export function formatPaymentMethod(method: string): string {
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatServiceType(type: string): string {
  return type.replace(/_/g, " & ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("And", "and");
}
