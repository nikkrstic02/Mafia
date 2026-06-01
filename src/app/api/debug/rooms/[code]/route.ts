import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { code } = await params;
  const localRooms = (globalThis as any).__MAFIA_ROOMS__ as Map<string, any> | undefined;

  if (!localRooms || !localRooms.has(code)) {
    return NextResponse.json({
      ok: false,
      error: "Room not found",
    });
  }

  localRooms.delete(code);

  return NextResponse.json({
    ok: true,
    message: `Deleted room ${code}`,
  });
}
