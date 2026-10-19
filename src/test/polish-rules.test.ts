import { describe, expect, it, vi } from "vitest";
import { inquirySchema } from "@/lib/commerce";
import { REQUEST_LIMIT, retryMessage } from "@/lib/request-policy";
import { QUERY_DEADLINE_MS, withQueryDeadline } from "@/lib/query-deadline";

describe("public requests", () => {
  it("accepts saved waitlist interest", () => {
    expect(
      inquirySchema.parse({
        kind: "waitlist",
        name: "Test",
        email: "qa@example.test",
        message: "Interested in Analyst availability",
      }).kind,
    ).toBe("waitlist");
  });
  it("rejects invalid email before submission", () => {
    expect(
      inquirySchema.safeParse({
        kind: "waitlist",
        name: "Test",
        email: "invalid",
        message: "Please notify me",
      }).success,
    ).toBe(false);
  });
  it("caps public inquiries at five an hour", () => {
    expect(REQUEST_LIMIT).toEqual({ inquiriesPerHour: 5, windowSeconds: 3600 });
    expect(retryMessage(61)).toContain("2 minute(s)");
  });
});

describe("read deadlines", () => {
  it("fails at exactly three seconds instead of remaining pending", async () => {
    vi.useFakeTimers();
    try {
      expect(QUERY_DEADLINE_MS).toBe(3000);
      const result = withQueryDeadline(() => new Promise(() => {}));
      const check = expect(result).rejects.toThrow("within 3 seconds");
      await vi.advanceTimersByTimeAsync(3000);
      await check;
    } finally {
      vi.useRealTimers();
    }
  });
  it("returns actual completed data", async () => {
    expect(await withQueryDeadline(async () => ({ events: 12 }))).toEqual({ events: 12 });
  });
  it("preserves original failures", async () => {
    await expect(
      withQueryDeadline(async () => {
        throw new Error("source offline");
      }),
    ).rejects.toThrow("source offline");
  });
});
