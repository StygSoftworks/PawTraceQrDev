import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#3B3A7A] text-white [a&]:hover:bg-[#3B3A7A]/90",
        secondary:
          "border-transparent bg-[#4D9FFF] text-white [a&]:hover:bg-[#4D9FFF]/90",
        destructive:
          "border-transparent bg-[#E44C9A] text-white [a&]:hover:bg-[#E44C9A]/90 focus-visible:ring-[#E44C9A]/30",
        outline:
          "text-[#1E1F24] border-[#C2C5CC] bg-transparent [a&]:hover:bg-[#F5F6F8] [a&]:hover:text-[#1E1F24] dark:text-[#F5F6F8] dark:border-[#C2C5CC]/40 dark:[a&]:hover:bg-[#C2C5CC]/10",
        success:
          "border-transparent bg-emerald-600 text-white [a&]:hover:bg-emerald-600/90 focus-visible:ring-emerald-600/30",
        warning:
          "border-transparent bg-[#FFD65A] text-[#1E1F24] [a&]:hover:bg-[#FFD65A]/90 focus-visible:ring-[#FFD65A]/30 font-semibold",
        info: 
          "border-transparent bg-[#4D9FFF] text-white [a&]:hover:bg-[#4D9FFF]/90 focus-visible:ring-[#4D9FFF]/30",
        muted:
          "border-transparent bg-[#C2C5CC]/30 text-[#1E1F24] [a&]:hover:bg-[#C2C5CC]/40 dark:bg-[#C2C5CC]/20 dark:text-[#F5F6F8]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }