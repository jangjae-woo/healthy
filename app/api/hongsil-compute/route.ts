// 나의 홍실 V3 — 1인 사주 + V3 캐릭터 매칭
import { NextRequest, NextResponse } from "next/server";
import { computeFullSajuCore, getShinkangLevel, topElement, weakElement } from "@/lib/saju-core";
import { matchCharacter, deriveIdealType } from "@/lib/hongsil/character-match";

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
    const me = computeFullSajuCore(body.me as PersonInput);
    if (!me) return NextResponse.json({ error: "saju compute failed" }, { status: 400 });
    const meGender: "남" | "여" = body.me.gender === "여" ? "여" : "남";
    const meMatch = matchCharacter(me, meGender);
    const destinyMatch = deriveIdealType(me, meGender);

    return NextResponse.json({
      me: {
        pillars: me.pillars,
        ilgan: me.ilgan,
        sipseong: me.sipseong,
        elements: me.elements,
        yongsin: me.yongsin,
        sinsal: me.sinsal,
        daeun: me.daeun,
        shinkang: getShinkangLevel(me),
        ohaengTop: topElement(me),
        ohaengWeak: weakElement(me),
      },
      character: { me: meMatch, destiny: destinyMatch },
    });
  } catch (e) {
    console.error("hongsil-compute error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
