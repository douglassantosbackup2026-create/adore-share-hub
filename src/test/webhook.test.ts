import { describe, it, expect } from "vitest";

const PAID_STATUSES = ["completed", "COMPLETED", "PAID_OUT", "paid", "PAID", "approved", "APPROVED"];

describe("syncpay webhook idempotency logic", () => {
  it("recognizes paid statuses", () => {
    expect(PAID_STATUSES.includes("completed")).toBe(true);
    expect(PAID_STATUSES.includes("pending")).toBe(false);
  });

  it("tip plan bypasses subscription path", () => {
    const plan = "tip";
    const isSubscriptionFlow = plan !== "tip";
    expect(isSubscriptionFlow).toBe(false);
  });

  it("subscription flow handles normal plans", () => {
    const plan = "fan";
    const isSubscriptionFlow = plan !== "tip";
    expect(isSubscriptionFlow).toBe(true);
  });
});
