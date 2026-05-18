"use client";

import { Suspense } from "react";
import YouaSlideReportResult from "@/components/YouaSlideReportResult";

export default function YouaResultPage() {
  return (
    <Suspense fallback={null}>
      <YouaSlideReportResult />
    </Suspense>
  );
}
