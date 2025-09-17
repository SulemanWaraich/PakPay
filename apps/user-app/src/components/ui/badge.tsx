import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../app/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-green-100 text-green-700 border-transparent hover:bg-green-200",
        secondary:
          "bg-yellow-100 text-yellow-700 border-transparent hover:bg-yellow-200",
        destructive:
          "bg-red-100 text-red-700 border-transparent hover:bg-red-200",
        outline: "text-gray-800 border border-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
