import { Suspense } from "react";
import ResultPage from "@/components/ResultPage";

export default function FaceResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a0a] flex items-center justify-center text-white">로딩중...</div>}>
      <ResultPage
        type="face"
        accent="#ffd700"
        bg="#1a1a0a"
        backHref="/face"
        emoji="🪬"
        title="정통 관상"
      />
    </Suspense>
  );
}
