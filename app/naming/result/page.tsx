import { Suspense } from "react";
import NamingResult from "@/components/NamingResult";

export default function NamingResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1e1408] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#e8b84b33", borderTopColor: "#e8b84b" }} />
      </div>
    }>
      <NamingResult />
    </Suspense>
  );
}
