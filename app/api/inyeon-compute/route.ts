import { NextRequest, NextResponse } from "next/server";
import { calcCompatibility } from "@/lib/saju-calculator";
import { computeFullSajuCore, getShinkangLevel, topElement, weakElement } from "@/lib/saju-core";
import { computeInyeonScores, scoreLabelFor, estimateAssetCurve, estimateTogetherCurve } from "@/lib/inyeon/scoring";
import { matchCharacter } from "@/lib/inyeon/character-match";
import { getPairLabelFor } from "@/lib/inyeon/character-pair";

export const maxDuration = 60;

interface PersonInput {
  name: string;
  year: number; month: number; day: number;
  hour: string;
  isLunar: boolean;
  gender: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const a = computeFullSajuCore(body.a as PersonInput);
    const b = computeFullSajuCore(body.b as PersonInput);
    if (!a || !b) {
      return NextResponse.json({ error: "saju compute failed" }, { status: 400 });
    }
    const compat = calcCompatibility(a, b);
    const scores = computeInyeonScores(a, b, compat);
    const aCurve = estimateAssetCurve(a);
    const bCurve = estimateAssetCurve(b);
    const togetherCurve = estimateTogetherCurve(aCurve, bCurve, scores.finance);

    // ─── 결정론 캐릭터 매칭 — 홍실 컨셉 ───
    const aGender: "남" | "여" = body.a.gender === "여" ? "여" : "남";
    const bGender: "남" | "여" = body.b.gender === "여" ? "여" : "남";
    const aMatch = matchCharacter(a, aGender);
    const bMatch = matchCharacter(b, bGender);
    const pairLabel = getPairLabelFor(aGender, aMatch.name, bGender, bMatch.name);

    return NextResponse.json({
      a: {
        pillars: a.pillars,
        ilgan: a.ilgan,
        sipseong: a.sipseong,
        elements: a.elements,
        yongsin: a.yongsin,
        sinsal: a.sinsal,
        shinkang: getShinkangLevel(a),
        ohaengTop: topElement(a),
        ohaengWeak: weakElement(a),
      },
      b: {
        pillars: b.pillars,
        ilgan: b.ilgan,
        sipseong: b.sipseong,
        elements: b.elements,
        yongsin: b.yongsin,
        sinsal: b.sinsal,
        shinkang: getShinkangLevel(b),
        ohaengTop: topElement(b),
        ohaengWeak: weakElement(b),
      },
      compat: {
        score: compat.score,
        scoreLabel: compat.scoreLabel,
        ilganRelation: compat.ilganRelation,
        ilganDetail: compat.ilganDetail,
        elementBalance: compat.elementBalance,
        branchRelations: compat.branchRelations,
        sharedSinsal: compat.sharedSinsal,
        strengths: compat.strengths,
        weaknesses: compat.weaknesses,
      },
      scores: {
        ...scores,
        labels: {
          inyeon: scoreLabelFor(scores.inyeon),
          seonggyeok: scoreLabelFor(scores.seonggyeok),
          emotion: scoreLabelFor(scores.emotion),
          physical: scoreLabelFor(scores.physical),
          finance: scoreLabelFor(scores.finance),
          marriage: scoreLabelFor(scores.marriage),
        },
      },
      curves: { a: aCurve, b: bCurve, together: togetherCurve },
      character: {
        a: aMatch,
        b: bMatch,
        pair: pairLabel,
      },
    });
  } catch (e) {
    console.error("inyeon-compute error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
