import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-surface-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent-primary text-surface-0 hover:bg-accent-primary-hover active:bg-accent-primary-active disabled:bg-accent-primary-disabled",
        destructive: "bg-semantic-error text-surface-0 hover:bg-semantic-error-hover active:bg-semantic-error-active disabled:bg-semantic-error-disabled",
        secondary: "bg-accent-secondary text-surface-0 hover:bg-accent-secondary-hover active:bg-accent-secondary-active disabled:bg-accent-secondary-disabled",
        tertiary: "bg-accent-tertiary text-surface-0 hover:bg-accent-tertiary-hover active:bg-accent-tertiary-active disabled:bg-accent-tertiary-disabled",
        success: "bg-semantic-success text-surface-0 hover:bg-semantic-success-hover active:bg-semantic-success-active disabled:bg-semantic-success-disabled",
        warning: "bg-semantic-warning text-surface-0 hover:bg-semantic-warning-hover active:bg-semantic-warning-active disabled:bg-semantic-warning-disabled",
        outline: "border border-accent-primary bg-surface-0 text-accent-primary hover:bg-accent-primary hover:text-surface-0 active:bg-accent-primary-active disabled:border-accent-primary-disabled disabled:text-accent-primary-disabled",
        ghost: "text-text-high hover:bg-surface-1 hover:text-text-high active:bg-surface-1-active disabled:text-text-low",
        link: "text-accent-primary underline-offset-4 hover:underline hover:text-accent-primary-hover disabled:text-accent-primary-disabled",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
