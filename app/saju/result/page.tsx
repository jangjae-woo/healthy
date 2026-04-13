import { Suspense } from "react";
import SajuSlideResult from "@/components/SajuSlideResult";

export default function SajuResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a0a2e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor:"#c9b4ff33", borderTopColor:"#c9b4ff" }} />
      </div>
    }>
      <SajuSlideResult />
    </Suspense>
  );
}
