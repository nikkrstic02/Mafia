"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ className, label, hint, id, ...props }: InputProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;

  return (
    <label className="block">
      {label ? (
        <div className="mb-2 text-xs font-medium tracking-wide text-white/70">
          {label}
        </div>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/40",
          "transition focus:border-white/20 focus:bg-white/7.5",
          className,
        )}
        {...props}
      />
      {hint ? (
        <div className="mt-2 text-xs text-white/50 leading-relaxed">{hint}</div>
      ) : null}
    </label>
  );
}
