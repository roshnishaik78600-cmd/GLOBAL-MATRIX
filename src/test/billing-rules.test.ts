import { describe, it, expect } from "vitest";
import {
  PLANS,
  CUSTOM_REPORT,
  priceFor,
  resolvePaymentMode,
  canTransition,
  canVerify,
  effectivePlan,
  validateGatewayEvent,
  isProduct,
  BRIEF_DAILY_LIMIT,
} from "@/lib/billing/core";

describe("prices and periods", () => {
  it("free is ₹0", () => expect(PLANS.free.price).toBe(0));
  it("analyst is ₹999/month", () =>
    expect(priceFor("analyst")).toEqual({ amount: 999, period: "month" }));
  it("business is ₹4,999/month", () =>
    expect(priceFor("business")).toEqual({ amount: 4999, period: "month" }));
  it("custom report is ₹2,500 one-time", () => {
    expect(priceFor("custom_report")).toEqual({ amount: 2500, period: "one_time" });
    expect(CUSTOM_REPORT.price).toBe(2500);
  });
  it("free is not an orderable product", () => expect(isProduct("free")).toBe(false));
});

describe("payment mode fails closed", () => {
  it("defaults to demo", () => expect(resolvePaymentMode({})).toBe("demo"));
  it("unknown value is demo", () =>
    expect(resolvePaymentMode({ PAYMENT_MODE: "live" })).toBe("demo"));
  it("manual_upi without readiness is demo", () =>
    expect(resolvePaymentMode({ PAYMENT_MODE: "manual_upi" })).toBe("demo"));
  it("gateway without readiness is demo", () =>
    expect(resolvePaymentMode({ PAYMENT_MODE: "gateway" })).toBe("demo"));
});

describe("order transitions", () => {
  it("demo orders can never be verified", () =>
    expect(canVerify({ status: "pending_verification", payment_mode: "demo" })).toBe(false));
  it("pending payment cannot jump to verified (forged success)", () =>
    expect(canTransition("pending_payment", "verified")).toBe(false));
  it("rejected is terminal", () => expect(canTransition("rejected", "verified")).toBe(false));
  it("verified manual UPI order is allowed from pending_verification", () =>
    expect(canVerify({ status: "pending_verification", payment_mode: "manual_upi" })).toBe(true));
});

describe("entitlements", () => {
  const now = new Date("2026-10-10T00:00:00Z");
  it("no subscription is free", () => expect(effectivePlan(null, now)).toBe("free"));
  it("expired paid plan is free", () =>
    expect(
      effectivePlan({ plan: "analyst", status: "active", expires_at: "2026-10-01T00:00:00Z" }, now),
    ).toBe("free"));
  it("cancelled paid plan is free", () =>
    expect(
      effectivePlan(
        { plan: "business", status: "cancelled", expires_at: "2026-12-01T00:00:00Z" },
        now,
      ),
    ).toBe("free"));
  it("active, unexpired business is business", () =>
    expect(
      effectivePlan(
        { plan: "business", status: "active", expires_at: "2026-11-01T00:00:00Z" },
        now,
      ),
    ).toBe("business"));
  it("brief limits: free 5, analyst 50, business 200", () =>
    expect(BRIEF_DAILY_LIMIT).toEqual({ free: 5, analyst: 50, business: 200 }));
});

describe("gateway event validation", () => {
  const order = { reference: "GM-ABC", amount_inr: 999, currency: "INR" };
  it("amount mismatch rejected", () =>
    expect(
      validateGatewayEvent(
        { order_reference: "GM-ABC", amount: 100, currency: "INR", status: "captured" },
        order,
      ),
    ).toEqual({ ok: false, reason: "amount_mismatch" }));
  it("currency mismatch rejected", () =>
    expect(
      validateGatewayEvent(
        { order_reference: "GM-ABC", amount: 99900, currency: "USD", status: "captured" },
        order,
      ),
    ).toEqual({ ok: false, reason: "currency_mismatch" }));
  it("order mismatch rejected", () =>
    expect(
      validateGatewayEvent(
        { order_reference: "GM-XYZ", amount: 99900, currency: "INR", status: "captured" },
        order,
      ),
    ).toEqual({ ok: false, reason: "order_mismatch" }));
  it("matching captured event accepted", () =>
    expect(
      validateGatewayEvent(
        { order_reference: "GM-ABC", amount: 99900, currency: "INR", status: "captured" },
        order,
      ),
    ).toEqual({ ok: true }));
});
