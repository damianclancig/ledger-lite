/**
 * Standard pattern for installment descriptions: "Description (X/Y)"
 * Captures: base description, current installment number, total installments
 */
export const INSTALLMENT_PATTERN = /^(.*) \((\d+)\/(\d+)\)$/;

/**
 * Parsed installment description data
 */
export interface ParsedInstallment {
  baseDescription: string;
  current: number;
  total: number;
}

/**
 * Parses an installment description to extract the base description and installment numbers
 * @param description - The full description to parse (e.g., "Purchase (1/12)")
 * @returns Parsed data or null if the description doesn't match the pattern
 */
export function parseInstallmentDescription(
  description: string
): ParsedInstallment | null {
  const match = description.match(INSTALLMENT_PATTERN);
  if (!match) return null;
  
  return {
    baseDescription: match[1].trim(),
    current: parseInt(match[2], 10),
    total: parseInt(match[3], 10),
  };
}

/**
 * Formats a base description with installment information
 * @param baseDescription - The base description without installment info
 * @param current - Current installment number (1-indexed)
 * @param total - Total number of installments
 * @returns Formatted description (e.g., "Purchase (1/12)")
 */
export function formatInstallmentDescription(
  baseDescription: string,
  current: number,
  total: number
): string {
  return `${baseDescription} (${current}/${total})`;
}

/**
 * Checks if a description follows the installment pattern
 * @param description - The description to check
 * @returns True if the description matches the installment pattern
 */
export function isInstallmentDescription(description: string): boolean {
  return INSTALLMENT_PATTERN.test(description);
}

/**
 * Extracts just the base description from an installment description
 * If the description doesn't match the pattern, returns the original description
 * @param description - The description to extract from
 * @returns The base description without installment info
 */
export function getBaseDescription(description: string): string {
  const parsed = parseInstallmentDescription(description);
  return parsed ? parsed.baseDescription : description;
}
