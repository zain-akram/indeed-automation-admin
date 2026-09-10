import type { TemplateDef } from '@/lib/types';

export function renderTemplate(template: TemplateDef, values: Record<string, string>): string {
  return template.variables.reduce(
    (text, name) => text.replaceAll(`{{${name}}}`, values[name]?.trim() || `{{${name}}}`),
    template.body,
  );
}
