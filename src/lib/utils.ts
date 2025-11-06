import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a currency string (e.g., $1,234.56).
 * Always uses USD for consistent formatting, as the currency symbol can be changed via CSS or UI.
 * @param value The number to format.
 * @returns The formatted currency string.
 */
export function formatCurrency(value: number): string {
  if (typeof value !== 'number') {
    return '$0.00';
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

/**
 * Formats a number into a compact "K" format for large numbers (e.g., $1.2k).
 * @param value The number to format.
 * @returns The compact formatted currency string.
 */
export function formatCurrencyK(value: number): string {
    if (typeof value !== 'number') {
      return '$0';
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value);
};

/**
 * Formats a numeric string for display in an input, adding thousand separators.
 * Handles decimal points correctly.
 * @param numStr The numeric string to format.
 * @returns The formatted string for display.
 */
export function formatNumberForDisplay(numStr: string): string {
  if (!numStr) return '';
  const [integerPart, decimalPart] = numStr.split('.');
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  if (decimalPart !== undefined) {
    return `${formattedIntegerPart}.${decimalPart}`;
  }
  
  if (numStr.slice(-1) === '.') {
    return `${formattedIntegerPart}.`;
  }
  
  return formattedIntegerPart;
};
