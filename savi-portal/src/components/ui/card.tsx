'use client';

/**
 * Card component for content containers
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Card Root
// ============================================

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  // Remove default padding
  noPadding?: boolean;
  // Add hover effect
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding = false, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-surface-200 bg-white shadow-soft',
        !noPadding && 'p-6',
        hoverable && 'transition-shadow duration-200 hover:shadow-glow',
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';

// ============================================
// Card Header
// ============================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  // Title text
  title?: string;
  // Description text
  description?: string;
  // Right side action
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-start justify-between gap-4', className)}
      {...props}
    >
      <div className="space-y-1">
        {title && (
          <h3 className="font-display text-lg font-semibold text-gray-900">
            {title}
          </h3>
        )}
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

// ============================================
// Card Content
// ============================================

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-4', className)} {...props} />
));

CardContent.displayName = 'CardContent';

// ============================================
// Card Footer
// ============================================

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-6 flex items-center justify-end gap-3 border-t border-surface-100 pt-4',
      className
    )}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

