import { Suspense } from "react";
import ResultPage from "@/components/ResultPage";

export default function NewYearResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a2a0a] flex items-center justify-center text-white">로딩중...</div>}>
      <ResultPage
        type="new-year"
        accent="#90ee90"
        bg="#0a2a0a"
        backHref="/new-year"
        emoji="🎋"
        title="신년 운세"
      />
    </Suspense>
  );
}
