import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Only available in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const localRooms = (globalThis as any).__MAFIA_ROOMS__ as Map<string, any> | undefined;

  if (!localRooms || localRooms.size === 0) {
    return NextResponse.json({
      totalRooms: 0,
      rooms: [],
    });
  }

  const rooms = Array.from(localRooms.entries()).map(([code, room]) => ({
    code,
    playerCount: Object.keys(room.players).length,
    players: Object.values(room.players).map((p: any) => ({
      name: p.name,
      connected: p.connected,
    })),
    phase: room.phase,
  }));

  return NextResponse.json({
    totalRooms: rooms.length,
    rooms,
  });
}

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { deleteAll } = await request.json().catch(() => ({ deleteAll: false }));

  const localRooms = (globalThis as any).__MAFIA_ROOMS__ as Map<string, any> | undefined;

  if (!localRooms || localRooms.size === 0) {
    return NextResponse.json({
      message: "No rooms to delete",
      deletedCount: 0,
    });
  }

  let deletedCount = 0;
  if (deleteAll) {
    deletedCount = localRooms.size;
    localRooms.clear();
  } else {
    for (const [code, room] of localRooms.entries()) {
      if (Object.keys(room.players).length === 0) {
        localRooms.delete(code);
        deletedCount++;
      }
    }
  }

  return NextResponse.json({
    message: deleteAll ? `Deleted all ${deletedCount} rooms` : `Deleted ${deletedCount} empty rooms`,
    deletedCount,
  });
}



