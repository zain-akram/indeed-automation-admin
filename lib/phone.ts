export const PK_WHATSAPP_REGEX = /^\+?923\d{9}$/;

export function isValidPkWhatsapp(value: string): boolean {
  return PK_WHATSAPP_REGEX.test(value.trim());
}

export const PK_WHATSAPP_ERROR =
  'WhatsApp number must be a valid Pakistani number in the format 923XXXXXXXXX, e.g. 923001234567';

// Keeps a typed/pasted WhatsApp value well-formed as it changes: strips non-digits and caps the
// length to the 12 digits of "923XXXXXXXXX", so a stray extra paste can't silently produce a
// mangled, overlong number sitting in the field.
export function sanitizePkWhatsappInput(value: string): string {
  const hasLeadingPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '').slice(0, 12);
  return hasLeadingPlus ? `+${digits}` : digits;
}
