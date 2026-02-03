import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/80 text-text-dark",
        warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
        error: "bg-red-500/20 text-red-400 border border-red-500/30",
        info: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const dotVariants = cva("w-1.5 h-1.5 rounded-full", {
  variants: {
    variant: {
      default: "bg-gray-500",
      warning: "bg-yellow-400",
      success: "bg-green-400",
      error: "bg-red-400",
      info: "bg-blue-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusChipVariants> {
  icon?: React.ReactNode;
  text?: string;
  showDot?: boolean;
}

const StatusChip = React.forwardRef<HTMLDivElement, StatusChipProps>(
  ({ className, variant, size, icon, text, showDot = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusChipVariants({ variant, size, className }))}
        {...props}
      >
        {showDot && <span className={cn(dotVariants({ variant }))} />}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{text || children}</span>
      </div>
    );
  }
);

StatusChip.displayName = "StatusChip";

export { StatusChip, statusChipVariants };
