/**
 * Russian pluralization: picks the correct word form based on count.
 *
 * @example pluralize(1, 'секунда', 'секунды', 'секунд') → 'секунда'
 * @example pluralize(3, 'секунда', 'секунды', 'секунд') → 'секунды'
 * @example pluralize(5, 'секунда', 'секунды', 'секунд') → 'секунд'
 */
export function pluralize(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count);
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  const mod10 = abs % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
