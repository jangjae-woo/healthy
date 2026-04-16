import { Suspense } from "react";
import MovingResult from "@/components/MovingResult";

export default function MovingResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1e14] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#5ec98e33", borderTopColor: "#5ec98e" }} />
      </div>
    }>
      <MovingResult />
    </Suspense>
  );
}
