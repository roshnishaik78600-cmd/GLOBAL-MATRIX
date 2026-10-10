/**
 * Billing core — pure, provider-independent rules. No I/O here, so every rule
 * is unit-tested and shared by server functions, pages and future adapters
 * (manual UPI verification, payment gateway webhooks).
 */

export type PlanId = "free" | "analyst" | "business";
export type ProductId = "analyst" | "business" | "custom_report";

/** Daily AI-analyst brief allowance per plan — enforced on the server. */
export const BRIEF_DAILY_LIMIT: Record<PlanId, number> = { free: 5, analyst: 50, business: 200 };

export const PLANS: Record<
  PlanId,
  { name: string; price: number; period: "month" | null; features: string[]; limits: string[] }
> = {
  free: {
    name: "Free Explorer",
    price: 0,
    period: null,
    features: [
      "World map, events, risk explorer and impact graph",
      "Country, industry, supply-chain, trade and market views",
      "Watchlist, notes and one saved exposure profile",
      "Sample intelligence report",
    ],
    limits: [
      `${BRIEF_DAILY_LIMIT.free} AI analyst briefs per day`,
      "Demonstration event corpus, not live news",
    ],
  },
  analyst: {
    name: "Analyst",
    price: 999,
    period: "month",
    features: [
      "Everything in Free Explorer",
      `${BRIEF_DAILY_LIMIT.analyst} AI analyst briefs per day`,
    ],
    limits: ["Same data coverage as Free Explorer", "Renewal is manual — no automatic charge"],
  },
  business: {
    name: "Business",
    price: 4999,
    period: "month",
    features: ["Everything in Analyst", `${BRIEF_DAILY_LIMIT.business} AI analyst briefs per day`],
    limits: ["Same data coverage as Free Explorer", "Renewal is manual — no automatic charge"],
  },
};

export const CUSTOM_REPORT = {
  name: "Custom Supply-Chain Risk Brief",
  price: 2500,
  period: "one_time" as const,
  deliverables: [
    "One industry or disruption, scoped with you by email",
    "Exposure of your declared countries, chokepoints and sector",
    "Evidence table, impact pathways and risk scores with uncertainty ranges",
    "Delivered as a PDF within 5 business days of verified payment and scope confirmation",
  ],
};

/** Server-side price lookup — the client never supplies an amount. */
export function priceFor(product: ProductId): { amount: number; period: "month" | "one_time" } {
  if (product === "custom_report") return { amount: CUSTOM_REPORT.price, period: "one_time" };
  return { amount: PLANS[product].price, period: "month" };
}

export function isProduct(x: unknown): x is ProductId {
  return x === "analyst" || x === "business" || x === "custom_report";
}

/* Payment mode ------------------------------------------------------ */

export type PaymentMode = "demo" | "manual_upi" | "gateway";

/**
 * Fail closed: anything other than an explicit, supported live mode is demo.
 * Live modes also need their own configuration (verified UPI QR / gateway
 * keys); until those exist this returns demo even if the variable says otherwise.
 */
export function resolvePaymentMode(env: {
  PAYMENT_MODE?: string;
  UPI_VERIFICATION_READY?: string;
  GATEWAY_READY?: string;
}): PaymentMode {
  const m = env.PAYMENT_MODE?.trim().toLowerCase();
  if (m === "manual_upi" && env.UPI_VERIFICATION_READY === "true") return "manual_upi";
  if (m === "gateway" && env.GATEWAY_READY === "true") return "gateway";
  return "demo";
}

/* Order state machine ---------------------------------------------- */

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "pending_verification"
  | "verified"
  | "rejected"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded";

export const OPEN_STATUSES: OrderStatus[] = ["draft", "pending_payment", "pending_verification"];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["pending_verification", "cancelled", "failed", "expired"],
  pending_verification: ["verified", "rejected", "cancelled"],
  verified: ["refunded", "expired"],
  rejected: [],
  failed: [],
  cancelled: [],
  expired: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Only a non-demo order may ever be verified. */
export function canVerify(order: { status: OrderStatus; payment_mode: PaymentMode }): boolean {
  return order.payment_mode !== "demo" && canTransition(order.status, "verified");
}

/* Entitlements ------------------------------------------------------ */

export type SubscriptionRow = {
  plan: PlanId;
  status: "active" | "cancelled" | "expired";
  expires_at: string | null;
} | null;

/** Effective plan from trusted persisted state only. */
export function effectivePlan(sub: SubscriptionRow, now: Date = new Date()): PlanId {
  if (!sub || sub.plan === "free") return "free";
  if (sub.status !== "active") return "free";
  if (!sub.expires_at || Date.parse(sub.expires_at) <= now.getTime()) return "free";
  return sub.plan;
}

/* Gateway event validation (for the future adapter) ----------------- */

export type GatewayEvent = {
  order_reference: string;
  amount: number;
  currency: string;
  status: string;
};

export function validateGatewayEvent(
  ev: GatewayEvent,
  order: { reference: string; amount_inr: number; currency: string },
): { ok: true } | { ok: false; reason: string } {
  if (ev.order_reference !== order.reference) return { ok: false, reason: "order_mismatch" };
  if (ev.currency !== order.currency) return { ok: false, reason: "currency_mismatch" };
  if (ev.amount !== order.amount_inr * 100) return { ok: false, reason: "amount_mismatch" }; // gateways use paise
  if (ev.status !== "captured") return { ok: false, reason: "not_captured" };
  return { ok: true };
}

export function newOrderReference(rand: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return `GM-${s}`;
}
