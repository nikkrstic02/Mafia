import { NextResponse } from "next/server";
import { requestRoleAction } from "@/lib/room-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json(await requestRoleAction(payload));
}
