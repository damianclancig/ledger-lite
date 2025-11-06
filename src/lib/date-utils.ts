
import { type Locale } from "date-fns";

/**
 * Safely formats a date string, avoiding timezone shifts by treating the date as a string.
 * This is the definitive, robust method to prevent timezone issues in the UI.
 * @param dateString The ISO date string (e.g., "2025-11-06T00:00:00.000Z") or a Date object.
 * @param formatString The desired format string (e.g., "dd/MM/yyyy", "PPP", "dd MMM ''yy", "MMMM yyyy").
 * @param locale The date-fns locale object, used for month names.
 * @returns The formatted date string.
 */
export function formatDateSafe(dateString: string | Date | undefined, formatString: string, locale: Locale): string {
  if (!dateString) {
    return "Invalid Date";
  }

  try {
    const isoString = typeof dateString === 'string' ? dateString : dateString.toISOString();
    
    // Extract YYYY-MM-DD part, which is always correct regardless of timezone.
    const datePart = isoString.split('T')[0];
    if (!datePart || datePart.length < 10) {
      return "Invalid Date";
    }

    const [year, month, day] = datePart.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return "Invalid Date";
    }

    const monthIndex = month - 1;

    switch (formatString) {
      case 'dd/MM/yyyy':
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      
      case 'PPP':
        // This is a simplified version of "long date" format.
        const monthNameLong = locale.localize?.month(monthIndex, { width: 'long' }) || '';
        return `${monthNameLong} ${day}, ${year}`;

      case "dd MMM ''yy":
        const monthNameShort = locale.localize?.month(monthIndex, { width: 'abbreviated' }) || '';
        const yearShort = String(year).slice(-2);
        return `${day} ${monthNameShort} '${yearShort}`;

      case 'MMMM yyyy':
        const monthFullName = locale.localize?.month(monthIndex, { width: 'long' }) || '';
        return `${monthFullName} ${year}`;
      
      case 'MMM yyyy':
        const monthAbbr = locale.localize?.month(monthIndex, { width: 'abbreviated' }) || '';
        return `${monthAbbr} ${year}`;

      default:
        // Fallback for any other format, though it might not be perfect.
        return datePart;
    }

  } catch (error) {
    console.error("Error formatting date:", error, "Input:", dateString);
    return "Invalid Date";
  }
}
