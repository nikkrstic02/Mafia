import { NextResponse } from "next/server";
import { joinRoomAction } from "@/lib/room-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json(await joinRoomAction(payload));
}
