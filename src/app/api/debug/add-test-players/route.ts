import { NextResponse } from "next/server";
import { createRoomAction, joinRoomAction } from "@/lib/room-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { playerCount = 5, roomCode } = await request.json();

  try {
    let code = roomCode;

    // Create new room if not provided
    if (!code) {
      const createResult = await createRoomAction({
        playerId: "test-host-" + Date.now(),
        name: "Test Host",
        narratorMode: "random",
      });

      if (!createResult.ok) {
        return NextResponse.json(createResult);
      }
      code = createResult.code;
    }

    // Add test players
    const addedPlayers = [];
    for (let i = 1; i < playerCount; i++) {
      const playerId = "test-player-" + Date.now() + "-" + i;
      const result = await joinRoomAction({
        code,
        playerId,
        name: `Test Player ${i}`,
      });

      if (result.ok) {
        addedPlayers.push(`Test Player ${i}`);
      }
    }

    return NextResponse.json({
      ok: true,
      code,
      addedPlayers,
      totalPlayers: playerCount,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
