import { describe, expect, it } from "vitest";

import { formatAed, secondsRemaining } from "./format";

describe("merchant data transformations", () => {
  it("formats API decimal strings as AED without floating display noise", () => {
    expect(formatAed("500.00")).toContain("500.00");
    expect(formatAed("10.00")).toContain("10.00");
  });

  it("clamps expired claim countdowns at zero", () => {
    expect(secondsRemaining("2026-08-30T12:00:30Z", Date.parse("2026-08-30T12:00:00Z"))).toBe(30);
    expect(secondsRemaining("2026-08-30T11:59:00Z", Date.parse("2026-08-30T12:00:00Z"))).toBe(0);
  });
});
