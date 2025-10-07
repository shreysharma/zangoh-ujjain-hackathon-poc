import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusChipVariants = cva(
  "inline-flex items-center gap-2 rounded-lg px-6 py-4 text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/80 text-text-dark",
        warning: "bg-yellow-100 text-yellow-800",
        success: "bg-green-100 text-green-800",
        error: "bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusChipVariants> {
  icon?: React.ReactNode;
}

const StatusChip = React.forwardRef<HTMLDivElement, StatusChipProps>(
  ({ className, variant, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusChipVariants({ variant, className }))}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </div>
    );
  }
);

StatusChip.displayName = "StatusChip";

export { StatusChip, statusChipVariants };
