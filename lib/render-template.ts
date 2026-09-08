import type { TemplateDef } from '@/lib/types';

export function renderTemplate(template: TemplateDef, values: Record<string, string>): string {
  return template.variables.reduce(
    (text, variable) => text.replaceAll(`{{${variable.name}}}`, values[variable.name]?.trim() || `{{${variable.name}}}`),
    template.body,
  );
}
