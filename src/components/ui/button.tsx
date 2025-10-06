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
          "bg-[#3B3A7A] text-white hover:bg-[#3B3A7A]/90 focus-visible:ring-[#3B3A7A]/30 shadow-sm",
        destructive:
          "bg-[#E44C9A] text-white hover:bg-[#E44C9A]/90 focus-visible:ring-[#E44C9A]/30 shadow-sm",
        outline:
          "border border-[#C2C5CC] bg-transparent hover:bg-[#F5F6F8] hover:text-[#1E1F24] focus-visible:ring-[#3B3A7A]/20 shadow-xs dark:border-[#C2C5CC]/40 dark:hover:bg-[#C2C5CC]/10",
        secondary:
          "bg-[#4D9FFF] text-white hover:bg-[#4D9FFF]/90 focus-visible:ring-[#4D9FFF]/30 shadow-sm",
        ghost:
          "hover:bg-[#F5F6F8] hover:text-[#1E1F24] focus-visible:ring-[#3B3A7A]/20 dark:hover:bg-[#C2C5CC]/10",
        link: 
          "text-[#4D9FFF] underline-offset-4 hover:underline hover:text-[#4D9FFF]/80 focus-visible:ring-[#4D9FFF]/30",
        success: 
          "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/30 shadow-sm",
        warning: 
          "bg-[#FFD65A] text-[#1E1F24] hover:bg-[#FFD65A]/90 focus-visible:ring-[#FFD65A]/30 shadow-sm font-semibold",
        info: 
          "bg-[#4D9FFF] text-white hover:bg-[#4D9FFF]/90 focus-visible:ring-[#4D9FFF]/30 shadow-sm",
        light: 
          "bg-[#F5F6F8] text-[#1E1F24] hover:bg-[#C2C5CC]/30 focus-visible:ring-[#C2C5CC]/20 border border-[#C2C5CC]",
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