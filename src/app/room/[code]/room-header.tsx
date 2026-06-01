"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getOrCreatePlayerId } from "@/lib/storage";

export function RoomHeader({ code }: { code: string }) {
  const router = useRouter();

  const handleExit = async () => {
    try {
      const playerId = getOrCreatePlayerId();
      // Use fetch with keepalive to ensure request completes even during navigation
      await fetch("/api/room/remove-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, playerId }),
        keepalive: true,
      });
    } catch {
      // Ignore errors, just navigate away
    }
    router.push("/");
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:mb-5 sm:px-4">
      <div className="min-w-0">
        <div className="text-xs text-white/50">Room code</div>
        <div className="mt-0.5 truncate text-base font-semibold tracking-tight sm:text-lg">
          {code.toUpperCase()}
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="h-9 shrink-0 rounded-lg px-3"
        onClick={handleExit}
      >
        Exit
      </Button>
    </div>
  );
}


