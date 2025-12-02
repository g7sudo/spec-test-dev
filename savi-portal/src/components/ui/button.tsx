'use client';

/**
 * Button component with variants
 * Built on Radix Slot for composition
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================
// Variants
// ============================================

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center gap-2 rounded-lg font-medium 
   transition-all duration-200 ease-out
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50
   active:scale-[0.98]`,
  {
    variants: {
      variant: {
        // Primary - main CTAs
        primary: `bg-primary-500 text-white hover:bg-primary-600 
                  focus-visible:ring-primary-500 shadow-sm hover:shadow-md`,
        
        // Secondary - less prominent actions
        secondary: `bg-surface-100 text-gray-900 hover:bg-surface-200 
                    focus-visible:ring-gray-400 border border-surface-200`,
        
        // Outline - bordered button
        outline: `border-2 border-primary-500 text-primary-600 
                  hover:bg-primary-50 focus-visible:ring-primary-500`,
        
        // Ghost - minimal button
        ghost: `text-gray-600 hover:text-gray-900 hover:bg-surface-100 
                focus-visible:ring-gray-400`,
        
        // Danger - destructive actions
        danger: `bg-error text-white hover:bg-red-600 
                 focus-visible:ring-error shadow-sm`,
        
        // Link - looks like a link
        link: `text-primary-600 underline-offset-4 hover:underline 
               focus-visible:ring-primary-500`,
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// ============================================
// Component
// ============================================

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Render as child element (for links that look like buttons)
  asChild?: boolean;
  // Loading state
  isLoading?: boolean;
  // Left icon
  leftIcon?: ReactNode;
  // Right icon
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        
        {/* Left icon */}
        {!isLoading && leftIcon}
        
        {/* Content */}
        {children}
        
        {/* Right icon */}
        {rightIcon}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };

