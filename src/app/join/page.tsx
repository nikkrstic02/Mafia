import { Suspense } from "react";
import JoinClient from "./join-client";

export default function JoinRoomPage() {
  return (
    <Suspense fallback={null}>
      <JoinClient />
    </Suspense>
  );
}
