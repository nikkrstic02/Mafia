import type { ReactNode } from "react";
import Link from "next/link";
import { Screen } from "@/components/screen";
import { Button } from "@/components/ui/button";

export default async function RoomLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Screen className="min-h-dvh">
      <div className="animate-fade-in-up w-full">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:mb-5 sm:px-4">
          <div className="min-w-0">
            <div className="text-xs text-white/50">Room code</div>
            <div className="mt-0.5 truncate text-base font-semibold tracking-tight sm:text-lg">
              {code.toUpperCase()}
            </div>
          </div>
          <Button asChild size="sm" variant="secondary" className="h-9 shrink-0 rounded-lg px-3">
            <Link href="/">Exit</Link>
          </Button>
        </div>

        {children}
      </div>
    </Screen>
  );
}
