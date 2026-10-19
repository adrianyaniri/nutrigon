/**
 * Normalizes Argentine and international phone numbers into the canonical format
 * required by the WhatsApp API (E.164 without leading +).
 * E.g. for Argentina: 549 + Area Code (without 0) + Local Number (without 15).
 * Example: 011-15-4450-1001 -> 5491144501001
 */
export function normalizeArgentineWhatsapp(input: string): string {
  if (!input) return "";
  let digits = input.trim().replace(/[^0-9]/g, "");
  if (!digits) return "";

  // If already starts with 54:
  if (digits.startsWith("54")) {
    if (digits.startsWith("549")) {
      return digits;
    }
    // Starts with 54 but missing the mobile 9 (e.g. 5411...)
    return `549${digits.slice(2)}`;
  }

  // Remove leading 0 from area code if present (e.g. 011 -> 11)
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // If starts with 1115, strip 15
  if (digits.startsWith("11") && digits.length >= 10 && digits.slice(2, 4) === "15") {
    digits = "11" + digits.slice(4);
  } else if (digits.length >= 11) {
    // 3-digit area codes like 351, 221, 341 etc followed by 15
    const threeDigitArea = digits.slice(0, 3);
    if (digits.slice(3, 5) === "15") {
      digits = threeDigitArea + digits.slice(5);
    }
  }

  // If it's a 10-digit Argentine number (e.g. 1144501001), prepend 549
  if (digits.length === 10) {
    return `549${digits}`;
  }

  // If starts with 9 and has 11 digits (e.g. 91144501001), prepend 54
  if (digits.startsWith("9") && digits.length === 11) {
    return `54${digits}`;
  }

  return digits;
}

/**
 * Formats a WhatsApp number for friendly human display.
 * E.g. 5491144501001 -> +54 9 11 4450-1001
 */
export function formatDisplayWhatsapp(raw: string): string {
  const norm = normalizeArgentineWhatsapp(raw);
  if (!norm) return "";

  if (norm.startsWith("549") && norm.length === 13) {
    // Standard Argentine mobile: +54 9 [area] [number]
    if (norm.startsWith("54911")) {
      return `+54 9 11 ${norm.slice(5, 9)}-${norm.slice(9)}`;
    }
    return `+54 9 ${norm.slice(3, 6)} ${norm.slice(6, 10)}-${norm.slice(10)}`;
  }

  return `+${norm}`;
}

export interface WhatsappValidationResult {
  isValid: boolean;
  normalized: string | null;
  error: string | null;
}

export function validateWhatsapp(
  input: string,
  required = false
): WhatsappValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    if (required) {
      return {
        isValid: false,
        normalized: null,
        error: "El número de WhatsApp es requerido.",
      };
    }
    return {
      isValid: true,
      normalized: null,
      error: null,
    };
  }

  const digits = trimmed.replace(/[^0-9]/g, "");
  if (!digits) {
    return {
      isValid: false,
      normalized: null,
      error: "El número de WhatsApp es inválido. Ingresá solo números.",
    };
  }

  const normalized = normalizeArgentineWhatsapp(trimmed);

  // An Argentine mobile number with 549 should have 13 digits (54 9 + 10 digits)
  if (normalized.startsWith("549") && normalized.length < 13) {
    return {
      isValid: false,
      normalized,
      error: `Faltan dígitos. Un celular argentino con código de área requiere 10 dígitos (ej: 11 4450-1001).`,
    };
  }

  if (normalized.length < 10) {
    return {
      isValid: false,
      normalized,
      error: "Faltan dígitos. El número debe incluir código de área y número local (mínimo 10 dígitos).",
    };
  }

  if (normalized.length > 15) {
    return {
      isValid: false,
      normalized,
      error: "El número de WhatsApp excede el límite internacional de 15 dígitos.",
    };
  }

  return {
    isValid: true,
    normalized,
    error: null,
  };
}
