/**
 * Standard regex pattern for installment descriptions.
 * 
 * Matches the format: "Description (X/Y)" where:
 * - Description: Any text (captured in group 1)
 * - X: Current installment number (captured in group 2)
 * - Y: Total number of installments (captured in group 3)
 * 
 * @example
 * ```typescript
 * INSTALLMENT_PATTERN.test('Purchase (1/12)'); // true
 * INSTALLMENT_PATTERN.test('Purchase'); // false
 * INSTALLMENT_PATTERN.test('Purchase (Cuota 1/12)'); // false
 * ```
 */
export const INSTALLMENT_PATTERN = /^(.*) \((\d+)\/(\d+)\)$/;

/**
 * Parsed installment description data.
 * 
 * Contains the extracted components of an installment description.
 */
export interface ParsedInstallment {
  /** The base description without installment information */
  baseDescription: string;
  /** Current installment number (1-indexed) */
  current: number;
  /** Total number of installments */
  total: number;
}

/**
 * Parses an installment description to extract its components.
 * 
 * Extracts the base description and installment numbers from a formatted
 * installment description. Returns null if the description doesn't match
 * the expected pattern.
 * 
 * @param description - The full description to parse (e.g., "Purchase (1/12)")
 * @returns Parsed installment data, or null if format is invalid
 * 
 * @example
 * ```typescript
 * const parsed = parseInstallmentDescription('Monthly Payment (3/12)');
 * // Returns: { baseDescription: 'Monthly Payment', current: 3, total: 12 }
 * 
 * const invalid = parseInstallmentDescription('Regular Payment');
 * // Returns: null
 * ```
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
 * Formats a base description with installment information.
 * 
 * Creates a standardized installment description by combining
 * the base description with the installment numbers in the format
 * "Description (X/Y)".
 * 
 * @param baseDescription - The base description without installment info
 * @param current - Current installment number (1-indexed)
 * @param total - Total number of installments
 * @returns Formatted description string
 * 
 * @example
 * ```typescript
 * formatInstallmentDescription('Purchase', 1, 12);
 * // Returns: "Purchase (1/12)"
 * 
 * formatInstallmentDescription('Monthly Subscription', 5, 24);
 * // Returns: "Monthly Subscription (5/24)"
 * ```
 */
export function formatInstallmentDescription(
  baseDescription: string,
  current: number,
  total: number
): string {
  return `${baseDescription} (${current}/${total})`;
}

/**
 * Checks if a description follows the installment pattern.
 * 
 * Validates whether a string matches the expected installment
 * description format "Description (X/Y)".
 * 
 * @param description - The description to check
 * @returns True if the description matches the installment pattern, false otherwise
 * 
 * @example
 * ```typescript
 * isInstallmentDescription('Purchase (1/12)'); // true
 * isInstallmentDescription('Purchase'); // false
 * isInstallmentDescription('Purchase [1/12]'); // false (wrong brackets)
 * ```
 */
export function isInstallmentDescription(description: string): boolean {
  return INSTALLMENT_PATTERN.test(description);
}

/**
 * Extracts the base description from an installment description.
 * 
 * Removes the installment information "(X/Y)" from a description,
 * returning only the base text. If the description doesn't match
 * the installment pattern, returns the original description unchanged.
 * 
 * @param description - The description to extract from
 * @returns The base description without installment info
 * 
 * @example
 * ```typescript
 * getBaseDescription('Purchase (3/12)');
 * // Returns: "Purchase"
 * 
 * getBaseDescription('Regular Purchase');
 * // Returns: "Regular Purchase" (unchanged)
 * ```
 */
export function getBaseDescription(description: string): string {
  const parsed = parseInstallmentDescription(description);
  return parsed ? parsed.baseDescription : description;
}
