/**
 * Icon Utilities
 * 
 * Helper functions for dynamically rendering Lucide icons
 */

import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

/**
 * Get a Lucide icon component by name
 * @param iconName - Name of the Lucide icon (e.g., "Home", "Car")
 * @returns The icon component or null if not found
 */
export function getLucideIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  
  const Icon = (LucideIcons as any)[iconName];
  return Icon || null;
}

/**
 * Get category icon component with fallback
 * @param iconName - Name of the Lucide icon
 * @param fallback - Fallback icon name if primary not found
 * @returns The icon component
 */
export function getCategoryIcon(iconName?: string, fallback: string = 'Circle'): LucideIcon {
  const Icon = getLucideIcon(iconName);
  if (Icon) return Icon;
  
  const FallbackIcon = getLucideIcon(fallback);
  return FallbackIcon || LucideIcons.Circle;
}
