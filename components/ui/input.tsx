import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("h-10 w-full rounded-lg border border-white/10 bg-[#0d0e10] px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
