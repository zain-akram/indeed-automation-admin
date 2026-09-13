export interface PlaceholderField {
  group: string;
  label: string;
  value: string;
}

export const EMAIL_PLACEHOLDER_FIELDS: PlaceholderField[] = [
  { group: 'Contact', label: 'Name', value: 'contact.name' },
  { group: 'Contact', label: 'Email', value: 'contact.email' },
  { group: 'Job', label: 'Title', value: 'job.title' },
  { group: 'Job', label: 'Description', value: 'job.description' },
  { group: 'WhatsApp', label: 'Link', value: 'whatsapp.link' },
  { group: 'WhatsApp', label: 'Number', value: 'whatsapp.number' },
];

export const SAMPLE_PLACEHOLDER_VALUES: Record<string, string> = {
  'contact.name': 'Jordan Smith',
  'contact.email': 'jordan.smith@example.com',
  'job.title': 'Customer Support Specialist',
  'job.description': 'Handle inbound support tickets and calls for our growing team.',
  'whatsapp.link': 'https://wa.me/15551234567',
  'whatsapp.number': '+1 555-123-4567',
};

export function resolvePlaceholders(source: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, value), source);
}

/**
 * For HTML body previews only (never the subject): turns {{whatsapp.number}} into a link to the same
 * WhatsApp chat as {{whatsapp.link}}, matching what the backend actually sends.
 */
export function withLinkedWhatsappNumber(values: Record<string, string>): Record<string, string> {
  const number = values['whatsapp.number'];
  const link = values['whatsapp.link'];
  if (!number || !link) {
    return values;
  }
  return { ...values, 'whatsapp.number': `<a href="${link}">${number}</a>` };
}

/**
 * Full HTML body preview, matching the backend's renderBody(): {{whatsapp.number}} becomes a link to the
 * WhatsApp chat, and {{whatsapp.link}} used directly in text (not inside an href="...") becomes a
 * friendly link instead of exposing the raw redirect URL — same split-on-tags trick the backend uses to
 * tell the two usages apart.
 */
export function resolveEmailBody(body: string, values: Record<string, string>, linkText?: string): string {
  const link = values['whatsapp.link'];
  const numberValues = withLinkedWhatsappNumber(values);

  if (!link) {
    return resolvePlaceholders(body, numberValues);
  }

  const displayText = linkText?.trim() || 'Message us on WhatsApp';
  return body
    .split(/(<[^>]*>)/g)
    .map((segment, index) => {
      const isTag = index % 2 === 1;
      if (isTag) {
        return resolvePlaceholders(segment, numberValues);
      }
      return segment
        .split('{{whatsapp.link}}')
        .map((part) => resolvePlaceholders(part, numberValues))
        .join(`<a href="${link}">${displayText}</a>`);
    })
    .join('');
}
