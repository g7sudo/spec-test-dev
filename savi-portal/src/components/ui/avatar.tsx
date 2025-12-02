'use client';

/**
 * Avatar component using Radix Avatar
 * Shows image with fallback to initials
 */

import { forwardRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

// ============================================
// Component
// ============================================

export interface AvatarProps {
  // Image source URL
  src?: string | null;
  // Alt text for accessibility
  alt?: string;
  // Fallback name for initials
  name?: string | null;
  // Size variant
  size?: 'sm' | 'md' | 'lg';
  // Additional classes
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, name, size = 'md', className }, ref) => {
    const initials = getInitials(name);

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
      >
        {/* Image */}
        <AvatarPrimitive.Image
          src={src || undefined}
          alt={alt || name || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
        />

        {/* Fallback - initials */}
        <AvatarPrimitive.Fallback
          className={cn(
            'flex h-full w-full items-center justify-center',
            'bg-primary-100 font-medium text-primary-700'
          )}
          delayMs={100}
        >
          {initials}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  }
);

Avatar.displayName = 'Avatar';

