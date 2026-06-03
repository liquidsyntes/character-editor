/**
 * Format ISO date string into Russian locale representation.
 */
export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
