"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-white hover:bg-primary-600 shadow-soft hover:shadow-glow",
        secondary:
          "bg-white text-primary-700 border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50",
        accent:
          "bg-accent-500 text-white hover:bg-accent-600 shadow-soft",
        ghost:
          "text-primary-600 hover:text-primary-700 hover:bg-primary-50",
        outline:
          "border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, href, children, ...props }, ref) => {
    if (href) {
      return (
        <a
          href={href}
          className={cn(buttonVariants({ variant, size, className }))}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
