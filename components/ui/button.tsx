import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center text-body font-medium polaris-transition focus-visible:polaris-focus disabled:pointer-events-none disabled:opacity-50 border",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground border-primary hover:bg-primary/90 polaris-shadow-sm",
        secondary: "bg-surface border-border text-foreground hover:bg-surface-hovered polaris-shadow-sm",
        destructive: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 polaris-shadow-sm",
        outline: "border-border bg-surface hover:bg-surface-hovered text-foreground polaris-shadow-sm",
        ghost: "border-transparent hover:bg-surface-hovered text-foreground",
        link: "text-interactive underline-offset-4 hover:underline border-transparent",
        success: "bg-success text-white border-success hover:bg-success/90 polaris-shadow-sm",
        warning: "bg-warning text-foreground border-warning hover:bg-warning/90 polaris-shadow-sm",
        blue: "bg-interactive text-white border-interactive hover:bg-interactive-hovered polaris-shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-body-sm rounded-md",
        default: "h-9 px-4 py-2 rounded-md",
        lg: "h-10 px-6 rounded-md",
        icon: "h-9 w-9 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
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