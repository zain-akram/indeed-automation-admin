// Pakistani mobile numbers (starting with country code 92) must strictly match the
// 923XXXXXXXXX shape. Any other country code is accepted more leniently as a plain
// international number (country code + subscriber number, 8-15 digits total, per E.164).
export const WHATSAPP_REGEX = /^\+?(923\d{9}|(?!92)\d{8,15})$/;

export function isValidWhatsapp(value: string): boolean {
  return WHATSAPP_REGEX.test(value.trim());
}

export const WHATSAPP_ERROR =
  'Enter a valid WhatsApp number with country code, e.g. 923001234567 for Pakistan or 971501234567 for the UAE';

// Keeps a typed/pasted WhatsApp value well-formed as it changes: strips non-digits and caps the
// length (12 digits for a Pakistani "923XXXXXXXXX" number, 15 for other countries), so a stray
// extra paste can't silently produce a mangled, overlong number sitting in the field.
export function sanitizeWhatsappInput(value: string): string {
  const hasLeadingPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  const maxLength = digits.startsWith('92') ? 12 : 15;
  const trimmed = digits.slice(0, maxLength);
  return hasLeadingPlus ? `+${trimmed}` : trimmed;
}
