export type VariableType = 'name' | 'role' | 'date' | 'text';

export const VARIABLE_TYPE_OPTIONS: { value: VariableType; label: string }[] = [
  { value: 'name', label: 'Candidate Name' },
  { value: 'role', label: 'Job / Role' },
  { value: 'date', label: 'Date & Time' },
  { value: 'text', label: 'Link / Text' },
];

/** WhatsApp templates address parameters either by name ({{name}}) or by position ({{1}}, {{2}}, ...). */
export function isPositionalTemplate(variables: string[]): boolean {
  return variables.length > 0 && variables.every((v) => /^\d+$/.test(v));
}

export function guessVariableType(name: string): VariableType {
  const lower = name.toLowerCase();
  if (lower.includes('time') || lower.includes('date')) return 'date';
  if (lower.includes('link') || lower.includes('url')) return 'text';
  if (lower.includes('role') || lower.includes('job') || lower.includes('title')) return 'role';
  if (lower.includes('name')) return 'name';
  return 'text';
}

export function humanizeVariableName(name: string): string {
  if (/^\d+$/.test(name)) {
    return `Variable ${name}`;
  }
  return name
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
