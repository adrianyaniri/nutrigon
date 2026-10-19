import { describe, expect, it } from "vitest";
import {
  formatDisplayWhatsapp,
  normalizeArgentineWhatsapp,
  validateWhatsapp,
} from "./whatsapp-formatter";

describe("whatsapp-formatter", () => {
  describe("normalizeArgentineWhatsapp", () => {
    it("normalizes a raw Argentine number without country code", () => {
      expect(normalizeArgentineWhatsapp("1144501001")).toBe("5491144501001");
    });

    it("strips leading 0 and mobile 15 prefix", () => {
      expect(normalizeArgentineWhatsapp("011 15 4450-1001")).toBe("5491144501001");
      expect(normalizeArgentineWhatsapp("011-15-4450-1001")).toBe("5491144501001");
    });

    it("handles already fully qualified 549 number", () => {
      expect(normalizeArgentineWhatsapp("5491144501001")).toBe("5491144501001");
      expect(normalizeArgentineWhatsapp("+54 9 11 4450-1001")).toBe("5491144501001");
    });

    it("handles 54 country code missing the mobile 9", () => {
      expect(normalizeArgentineWhatsapp("541144501001")).toBe("5491144501001");
      expect(normalizeArgentineWhatsapp("+54 11 4450 1001")).toBe("5491144501001");
    });

    it("returns null or empty for empty input", () => {
      expect(normalizeArgentineWhatsapp("")).toBe("");
      expect(normalizeArgentineWhatsapp("   ")).toBe("");
    });
  });

  describe("formatDisplayWhatsapp", () => {
    it("formats a standard 549 number for display", () => {
      expect(formatDisplayWhatsapp("5491144501001")).toBe("+54 9 11 4450-1001");
    });

    it("returns formatted version of partially typed or clean number", () => {
      expect(formatDisplayWhatsapp("1144501001")).toBe("+54 9 11 4450-1001");
    });
  });

  describe("validateWhatsapp", () => {
    it("validates correct Argentine mobile numbers", () => {
      const result = validateWhatsapp("011-15-4450-1001");
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe("5491144501001");
      expect(result.error).toBeNull();
    });

    it("fails when digits are insufficient", () => {
      const result = validateWhatsapp("114450");
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/Faltan dígitos/i);
    });

    it("fails when input contains no digits", () => {
      const result = validateWhatsapp("abc-xyz");
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/inválido/i);
    });

    it("allows optional empty number when not strictly required", () => {
      const result = validateWhatsapp("", false);
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBeNull();
    });
  });
});
