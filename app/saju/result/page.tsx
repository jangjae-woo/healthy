import { Suspense } from "react";
import ResultPage from "@/components/ResultPage";

export default function SajuResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a0a2e] flex items-center justify-center text-white">로딩중...</div>}>
      <ResultPage
        type="saju"
        accent="#c9b4ff"
        bg="#1a0a2e"
        backHref="/saju"
        emoji="🌙"
        title="평생 사주"
      />
    </Suspense>
  );
}
