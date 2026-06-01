import type { ReactNode } from "react";
import { Screen } from "@/components/screen";
import { RoomHeader } from "./room-header";

export default async function RoomLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Screen className="min-h-dvh">
      <div className="animate-fade-in-up w-full">
        <RoomHeader code={code} />
        {children}
      </div>
    </Screen>
  );
}
