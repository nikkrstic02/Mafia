import { NextResponse } from "next/server";
import { setNarratorAction } from "@/lib/room-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json(await setNarratorAction(payload));
}
