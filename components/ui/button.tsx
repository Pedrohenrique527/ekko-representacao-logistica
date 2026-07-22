import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[9px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_8px_20px_rgba(6,89,105,.18)] hover:-translate-y-px hover:bg-[var(--primary-hover)] hover:shadow-[0_10px_24px_rgba(6,89,105,.24)]",
        secondary: "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] shadow-sm hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)]",
        ghost: "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
        danger: "border border-red-500/20 bg-red-500/10 text-[var(--danger)] hover:bg-red-500/15",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
