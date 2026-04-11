import { Suspense } from "react";
import ResultPage from "@/components/ResultPage";

export default function LoveResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#2a0a1a] flex items-center justify-center text-white">로딩중...</div>}>
      <ResultPage
        type="saju-love"
        accent="#ffb4c8"
        bg="#2a0a1a"
        backHref="/saju-love"
        emoji="🌸"
        title="연애 사주"
      />
    </Suspense>
  );
}
