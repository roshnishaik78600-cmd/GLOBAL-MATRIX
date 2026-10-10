import { describe, expect, it } from "vitest";
import { PRICING, DEMO_PAYMENT_MODE, PAYMENT_QR } from "@/lib/commerce";

// The pilot pricing the user set: ₹2,500 one-time report, ₹4,999/month
// monitoring. Payment is demo-only until a real UPI QR is supplied, and no
// payment destination may be encoded anywhere.
describe("manual UPI payment demo mode", () => {
  it("keeps the pilot prices unchanged", () => {
    expect(PRICING.report.price).toBe(2500);
    expect(PRICING.monitoring.price).toBe(4999);
    expect(PRICING.report.cadence).toBe("one-time");
    expect(PRICING.monitoring.cadence).toBe("per month");
  });

  it("keeps payment in demo mode with submission disabled", () => {
    expect(DEMO_PAYMENT_MODE).toBe(true);
  });

  it("encodes no UPI ID, bank account or payment destination", () => {
    expect(PAYMENT_QR).toBeNull();
  });
});
