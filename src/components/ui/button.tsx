import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/30 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30 shadow-sm",
        outline:
          "border border-input bg-transparent hover:bg-accent/10 hover:text-accent-foreground focus-visible:ring-ring/20 shadow-xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-secondary/30 shadow-sm",
        ghost:
          "hover:bg-accent/10 hover:text-accent-foreground focus-visible:ring-ring/20",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary/80 focus-visible:ring-primary/30",
        success:
          "bg-success text-white hover:bg-success-dark focus-visible:ring-success/30 shadow-sm",
        warning:
          "bg-warning text-foreground hover:bg-warning-dark focus-visible:ring-warning/30 shadow-sm font-semibold",
        info:
          "bg-brand-teal text-white hover:bg-brand-teal/90 focus-visible:ring-brand-teal/30 shadow-sm",
        light:
          "bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-muted/20 border border-border",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }