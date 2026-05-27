"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/screen";
import { getSocket, emitWithAck } from "@/lib/socket";
import {
  getOrCreatePlayerId,
  getSavedName,
  saveName,
  savePlayerId,
} from "@/lib/storage";

export default function JoinClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCode = (searchParams.get("code") ?? "").toUpperCase();
  const initialName = searchParams.get("name") ?? "";
  const testPlayerId = searchParams.get("testPlayerId");
  const auto = searchParams.get("auto") === "1";

  const [name, setName] = React.useState(
    initialName || (typeof window === "undefined" ? "" : getSavedName()),
  );
  const [code, setCode] = React.useState(initialCode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const doJoin = React.useCallback(
    async (nextCode?: string, nextName?: string) => {
      setError(null);
      const roomCode = (nextCode ?? code)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 8);
      const nickname = (nextName ?? name).trim();
      if (!roomCode) return setError("Enter a room code.");
      if (!nickname) return setError("Enter a nickname.");

      setLoading(true);
      saveName(nickname);
      const playerId = testPlayerId ?? getOrCreatePlayerId();
      if (testPlayerId) savePlayerId(testPlayerId);

      try {
        const socket = getSocket();
        const res = await emitWithAck<{ ok: boolean; error?: string }>(
          socket,
          "room:join",
          { code: roomCode, playerId, name: nickname },
        );

        if (!res.ok) {
          setError(res.error ?? "Failed to join room.");
          return;
        }

        router.push(`/room/${roomCode}/lobby`);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [code, name, router, testPlayerId],
  );

  const autoRan = React.useRef(false);
  React.useEffect(() => {
    if (autoRan.current) return;
    if (!auto) return;
    if (!initialCode || !initialName) return;
    autoRan.current = true;
    void Promise.resolve().then(() => doJoin(initialCode, initialName));
  }, [auto, doJoin, initialCode, initialName]);

  return (
    <Screen>
      <div className="animate-fade-in-up space-y-4">
        <Card title="Join a room">
          <div className="space-y-4">
            <Input
              label="Room code"
              placeholder="ABCDE"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8),
                )
              }
              hint="Ask the host for the room code."
              inputMode="text"
              autoCapitalize="characters"
              maxLength={8}
            />
            <Input
              label="Your nickname"
              placeholder="e.g., Mila"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button size="lg" disabled={loading} onClick={() => doJoin()}>
              {loading ? "Joining..." : "Join room"}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => router.push("/create")}>
              Create instead
            </Button>
          </div>
        </Card>
      </div>
    </Screen>
  );
}

