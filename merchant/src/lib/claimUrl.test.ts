import { describe, expect, it } from "vitest";

import { InvalidClaimUrlError, parseClaimToken } from "../../../utils/claimUrl";

const token = "A".repeat(43);

describe("canonical DinePanel claim URL parser", () => {
  it("extracts the opaque token from production, development, and deep-link URLs", () => {
    expect(parseClaimToken(`https://dinepanel.com/claim/${token}`, false)).toBe(token);
    expect(parseClaimToken(`http://localhost/claim/${token}`, false)).toBe(token);
    expect(parseClaimToken(`dinepanel://claim/${token}`, false)).toBe(token);
    expect(parseClaimToken(token)).toBe(token);
  });

  it("rejects arbitrary QR data, trusted fields, query strings, and invalid tokens", () => {
    expect(() => parseClaimToken("https://example.com/bill/500", false)).toThrow(InvalidClaimUrlError);
    expect(() => parseClaimToken(`https://dinepanel.com/claim/${token}?amount=500`, false)).toThrow(InvalidClaimUrlError);
    expect(() => parseClaimToken("GC-83928", false)).toThrow(InvalidClaimUrlError);
  });
});
