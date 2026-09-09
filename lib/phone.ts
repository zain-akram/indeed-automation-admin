export const PK_WHATSAPP_REGEX = /^\+?923\d{9}$/;

export function isValidPkWhatsapp(value: string): boolean {
  return PK_WHATSAPP_REGEX.test(value.trim());
}

export const PK_WHATSAPP_ERROR = 'WhatsApp number must be a valid Pakistani number in the format 923XXXXXXXXX, e.g. 923001234567';
