import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]", className)} {...props} />;
}
