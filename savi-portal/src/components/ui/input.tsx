'use client';

/**
 * Input component with label and error state
 */

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';
import * as Label from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

// ============================================
// Component
// ============================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Label text
  label?: string;
  // Error message
  error?: string;
  // Helper text
  helperText?: string;
  // Left addon (icon or text)
  leftAddon?: ReactNode;
  // Right addon (icon or text)
  rightAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      id,
      ...props
    },
    ref
  ) => {
    // Use React's useId for stable SSR-safe ID generation
    const generatedId = useId();
    const inputId = id || generatedId;
    
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <Label.Root
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {label}
          </Label.Root>
        )}
        
        {/* Input wrapper for addons */}
        <div className="relative">
          {/* Left addon */}
          {leftAddon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftAddon}
            </div>
          )}
          
          {/* Input field */}
          <input
            type={type}
            id={inputId}
            ref={ref}
            className={cn(
              // Base styles
              `block w-full rounded-lg border bg-white px-4 py-2.5
               text-gray-900 placeholder-gray-400
               transition-all duration-200
               focus:outline-none focus:ring-2 focus:ring-offset-0`,
              // Normal state
              !error && 'border-surface-200 focus:border-primary-500 focus:ring-primary-500/20',
              // Error state
              error && 'border-error focus:border-error focus:ring-error/20',
              // Addon padding
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              // Disabled state
              'disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-gray-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {/* Right addon */}
          {rightAddon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightAddon}
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error">
            {error}
          </p>
        )}
        
        {/* Helper text */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

