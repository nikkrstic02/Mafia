"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { RoleCard } from "@/components/role-card";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/roles";
import { useRoom } from "@/lib/use-room";
import { getSocket, emitWithAck } from "@/lib/socket";

export default function RoleRevealPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  const { room, connected, joined, error: joinError } = useRoom(code);

  const [loading, setLoading] = React.useState(false);
  const [role, setRole] = React.useState<Role | null>(null);
  const [mafiaMates, setMafiaMates] = React.useState<string[]>([]);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const requestedRef = React.useRef(false);

  const fetchRole = React.useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const socket = getSocket();
      const res = await emitWithAck<{
        ok: boolean;
        error?: string;
        role?: Role;
        mafiaMates?: string[];
      }>(socket, "game:requestRole", { code });

      if (res.ok && res.role) {
        setRole(res.role);
        setMafiaMates(res.mafiaMates ?? []);
      } else {
        setActionError(res.error ?? "Failed to fetch role.");
      }
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  React.useEffect(() => {
    if (!connected || !joined || role || loading || requestedRef.current || room?.phase !== "reveal") return;
    requestedRef.current = true;
    const timeout = window.setTimeout(() => void fetchRole(), 0);
    return () => window.clearTimeout(timeout);
  }, [connected, fetchRole, joined, loading, role, room?.phase]);

  const restartMatch = async () => {
    setActionError(null);
    try {
      const socket = getSocket();
      const res = await emitWithAck<{ ok: boolean; error?: string }>(
        socket,
        "game:restart",
        { code },
      );
      if (!res.ok) setActionError(res.error ?? "Failed to restart match.");
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-104px)] flex-col items-center justify-center pb-6 sm:min-h-[calc(100dvh-118px)] sm:pb-8">
      {joinError && (
        <div className="mb-4 w-full max-w-[325px] rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {joinError}
        </div>
      )}
      <RoleCard
        role={role ?? undefined}
        subtitle={
          loading
            ? "Loading your role..."
            : !room
            ? "Connecting to room..."
            : room.phase !== "reveal"
            ? "Waiting for the game to start..."
            : undefined
        }
      />
      {role === "Narrator" ? (
        <Button className="mt-5 w-full max-w-[325px]" size="lg" onClick={restartMatch}>
          Restart match
        </Button>
      ) : null}
      {actionError ? (
        <div className="mt-4 w-full max-w-[325px] rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-200">
          {actionError}
        </div>
      ) : null}
      {role === "Mafia" && mafiaMates.length ? (
        <p className="mt-4 max-w-[325px] text-center text-sm text-white/60">
          Other Mafia: {mafiaMates.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
