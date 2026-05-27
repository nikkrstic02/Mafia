"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PlayerList } from "@/components/player-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { emitWithAck, getSocket } from "@/lib/socket";
import { getOrCreatePlayerId } from "@/lib/storage";
import { useRoom } from "@/lib/use-room";

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  const { room, error } = useRoom(code);
  const currentUserId = getOrCreatePlayerId();

  const [actionError, setActionError] = React.useState<string | null>(null);

  const isHost = room?.hostId === currentUserId;
  const canStart =
    !!room &&
    room.phase === "lobby" &&
    room.players.length >= 7 &&
    room.players.length <= 13 &&
    (room.narratorMode === "random" || !!room.narratorId) &&
    isHost;

  const selectNarrator = async (narratorId: string) => {
    setActionError(null);
    try {
      const socket = getSocket();
      const res = await emitWithAck<{ ok: boolean; error?: string }>(
        socket,
        "room:setNarrator",
        { code, narratorId },
      );
      if (!res.ok) setActionError(res.error ?? "Failed.");
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const startGame = async () => {
    setActionError(null);
    try {
      const socket = getSocket();
      const res = await emitWithAck<{ ok: boolean; error?: string }>(
        socket,
        "game:start",
        { code },
      );
      if (!res.ok) setActionError(res.error ?? "Failed to start.");
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard access can be blocked in some browser contexts.
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Lobby">
        <div className="space-y-4">
          <div className="text-sm text-white/70">
            {room?.narratorMode === "choose"
              ? "Narrator mode: choose from player list"
              : "Narrator mode: random narrator"}
          </div>

          {room ? (
            <div className="text-sm text-white/50">
              Host:{" "}
              {room.players.find((p) => p.id === room.hostId)?.name ||
                "Unknown"}
              {isHost ? " (You)" : ""}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {room ? (
            <PlayerList
              players={room.players}
              narratorId={room.narratorId}
              onSelectNarrator={
                room.narratorMode === "choose" ? selectNarrator : undefined
              }
            />
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button size="lg" disabled={!canStart} onClick={startGame}>
              Start game
            </Button>
            <Button size="lg" variant="secondary" onClick={copyCode}>
              Copy room code
            </Button>
          </div>

          {actionError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {actionError}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
