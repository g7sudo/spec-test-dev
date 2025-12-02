/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for conflict resolution
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind conflict resolution
 * Use this for all dynamic className construction
 * 
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary-500', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

