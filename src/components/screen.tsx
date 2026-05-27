import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Screen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-dvh w-full overflow-x-hidden bg-background",
        className,
      )}
    >
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-4 sm:max-w-lg sm:px-6 sm:py-6">
        {children}
      </div>
    </div>
  );
}
