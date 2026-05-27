import * as React from "react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "accent" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-white border-white/10",
    accent: "bg-violet-400/15 text-violet-100 border-violet-400/20",
    danger: "bg-red-500/15 text-red-50 border-red-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

