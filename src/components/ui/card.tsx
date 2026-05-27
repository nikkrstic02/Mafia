import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({
  title,
  children,
  className,
  footer,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-4 sm:rounded-2xl sm:p-5",
        "shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        </header>
      ) : null}
      <div className={cn(title ? "mt-3" : "")}>{children}</div>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </section>
  );
}
