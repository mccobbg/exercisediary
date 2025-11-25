import { format } from 'date-fns';

/**
 * Get ordinal suffix for a day (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Format date in the standard project format
 * @param date - Date to format
 * @returns Formatted date string (e.g., "1st Sep 2025")
 */
export function formatDate(date: Date): string {
  const day = parseInt(format(date, 'd'), 10);
  const ordinal = getOrdinalSuffix(day);
  return `${day}${ordinal} ${format(date, 'MMM yyyy')}`;
}
