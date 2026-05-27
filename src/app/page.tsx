import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/screen";

export default function Home() {
  return (
    <Screen>
      <div className="animate-fade-in-up flex min-h-[calc(100dvh-2rem)] w-full flex-col items-center justify-center sm:min-h-[calc(100dvh-3rem)]">
        <h1 className="animate-mafia-title bg-gradient-to-r from-red-500 via-amber-300 to-violet-400 bg-[length:220%_220%] bg-clip-text text-center text-7xl font-black tracking-[0.18em] text-transparent drop-shadow-[0_14px_40px_rgba(0,0,0,0.75)] sm:text-8xl">
          MAFIA
        </h1>

        <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link href="/create">Create room</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/join">Join room</Link>
          </Button>
        </div>
      </div>
    </Screen>
  );
}
