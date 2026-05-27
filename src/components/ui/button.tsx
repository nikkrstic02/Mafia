"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] " +
  "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";

const variants: Record<Variant, string> = {
  primary:
    "bg-white text-black hover:bg-white/90 shadow-[0_10px_25px_rgba(0,0,0,0.35)]",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost: "bg-transparent hover:bg-white/10 text-white",
  danger:
    "bg-red-500/90 text-white hover:bg-red-500 border border-red-500/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild,
  children,
  ...props
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);

  if (asChild) {
    const meaningfulChildren = React.Children.toArray(children).filter((c) => {
      if (typeof c === "string") return c.trim().length > 0;
      return true;
    });
    const elementChildren = meaningfulChildren.filter((c) =>
      React.isValidElement(c),
    ) as Array<React.ReactElement<{ className?: string }>>;

    if (elementChildren.length !== 1) {
      throw new Error(
        "Button with asChild expects exactly one React element child.",
      );
    }

    const child = elementChildren[0];
    return React.cloneElement(child, {
      ...(props as unknown as Partial<typeof child.props>),
      className: cn(cls, child.props.className),
    });
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
