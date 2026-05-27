import { Suspense } from "react";
import JoinClient from "./join-client";
import { Screen } from "@/components/screen";
import { Card } from "@/components/ui/card";

export default function JoinRoomPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <div className="animate-fade-in-up space-y-4">
            <Card title="Join a room">
              <div className="text-sm text-white/60">Loading join form...</div>
            </Card>
          </div>
        </Screen>
      }
    >
      <JoinClient />
    </Suspense>
  );
}
