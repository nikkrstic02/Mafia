import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Player } from "@/types/room";

export function PlayerList({
  players,
  narratorId,
  onSelectNarrator,
  className,
}: {
  players: Player[];
  narratorId?: string | null;
  onSelectNarrator?: (playerId: string) => void;
  className?: string;
}) {
  const canChooseNarrator = !!onSelectNarrator;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Players</div>
        {canChooseNarrator && narratorId ? (
          <Badge tone="accent">Narrator selected</Badge>
        ) : (
          <Badge>{players.length} in lobby</Badge>
        )}
      </div>

      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:gap-3 sm:px-4"
          >
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                p.connected ? "bg-emerald-400" : "bg-white/25",
              )}
            />
            <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
            {canChooseNarrator ? (
              <Button
                size="sm"
                variant={narratorId === p.id ? "primary" : "secondary"}
                className="h-8 shrink-0 rounded-lg px-2.5 text-xs sm:px-3"
                onClick={() => onSelectNarrator(p.id)}
              >
                {narratorId === p.id ? "Narrator" : "Choose"}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
