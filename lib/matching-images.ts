// 홍도인(紅道人) 궁합 이미지 매핑
// 117장 이미지 라이브러리 → 점수·관계·키워드 기반 자동 선택
// 평생사주(묵도인)와 완전 분리됨. 평생사주 코드는 절대 건드리지 않음.

import type { CompatibilityResult } from "./saju-calculator";

export const MATCHING_IMG_BASE = "/matching-image";

// ── 일간 → 오행 변환 ──────────────────────────
const STEM_TO_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

// ── 1. 캐릭터 페어 (15장) ──
// 두 사람 일간 오행 페어로 결정. 자기페어 5종 + 교차 10종 = 15
export function pickCharacterImage(ilganA: string, ilganB: string): string {
  const elA = STEM_TO_ELEM[ilganA] ?? "수";
  const elB = STEM_TO_ELEM[ilganB] ?? "수";
  // 정해진 키 형식에 맞게 매핑 (이미지 파일명 기준)
  // 파일명은 "캐릭터_목수" 같이 정해져 있고, "수목" 키로 들어와도 같은 이미지
  const key = [elA, elB].sort().join(""); // 알파벳/한글 정렬
  // 한글 정렬은 가나다순이라 (금<목<수<토<화)
  const map: Record<string, string> = {
    목목: "001_캐릭터_목목.png",
    목화: "002_캐릭터_목화.png",
    목토: "003_캐릭터_목토.png",
    금목: "004_캐릭터_목금.png", // sort: 금 < 목
    목수: "005_캐릭터_목수.png", // sort: 목 < 수
    화화: "006_캐릭터_화화.png",
    토화: "007_캐릭터_화토.png", // sort: 토 < 화
    금화: "008_캐릭터_화금.png", // sort: 금 < 화
    수화: "009_캐릭터_화수.png", // sort: 수 < 화
    토토: "010_캐릭터_토토.png",
    금토: "011_캐릭터_토금.png", // sort: 금 < 토
    수토: "012_캐릭터_토수.png", // sort: 수 < 토
    금금: "013_캐릭터_금금.png",
    금수: "014_캐릭터_금수.png", // sort: 금 < 수
    수수: "015_캐릭터_수수.png",
  };
  return map[key] ?? "015_캐릭터_수수.png";
}

// 두 사람 페어 라벨 (이미지와 함께 표시할 텍스트)
export function characterPairLabel(ilganA: string, ilganB: string): { a: string; b: string; theme: string } {
  const elA = STEM_TO_ELEM[ilganA] ?? "수";
  const elB = STEM_TO_ELEM[ilganB] ?? "수";
  const ELEM_NAME: Record<string, string> = {
    목: "큰 나무", 화: "타오르는 불꽃", 토: "넓은 대지", 금: "단단한 강철", 수: "깊은 강물",
  };
  const themes: Record<string, string> = {
    목목: "함께 자라는 두 그루의 나무",
    목화: "나무가 불을 살리는 인연",
    목토: "나무가 대지에 뿌리내리는 인연",
    금목: "도끼와 거목, 다듬어가는 인연",
    목수: "물이 나무를 키우는 인연",
    화화: "두 개의 태양, 빛나는 인연",
    토화: "불이 흙을 단단하게 하는 인연",
    금화: "용광로와 강철, 단련되는 인연",
    수화: "물과 불, 서로 다른 본성의 인연",
    토토: "두 산처럼 굳건한 인연",
    금토: "산속의 광맥, 보물 같은 인연",
    수토: "산과 호수, 마주 비추는 인연",
    금금: "두 자루의 검, 의리의 인연",
    금수: "칼이 강물에 비치는 인연",
    수수: "두 강물이 합쳐지는 인연",
  };
  const key = [elA, elB].sort().join("");
  return {
    a: ELEM_NAME[elA] ?? "",
    b: ELEM_NAME[elB] ?? "",
    theme: themes[key] ?? "묘한 인연",
  };
}

// ── 2. 사자성어 라벨 (15장) ──
// 점수 + 관계 지표로 결정. 우선순위 위→아래
export interface SajaSeongeoResult {
  hanja: string;        // "天生緣分"
  hangul: string;       // "천생연분"
  meaning: string;      // 한글 풀이
  image: string;        // 파일명
}
export function pickSajaSeongeo(compat: CompatibilityResult): SajaSeongeoResult {
  const s = compat.score;
  const ilgan = compat.ilganRelation; // '비화(比和)', '상생 (...)', '상극 (...)' 중 하나
  const isSangsaeng = ilgan.includes("상생");
  const isSanggeuk = ilgan.includes("상극");
  const isBihwa = ilgan.includes("비화");
  const chungs = compat.branchRelations.chung.length;
  const samhap = compat.branchRelations.samhap.length;
  const yukhap = compat.branchRelations.yukhap.length;

  // 90+ 강한 인연
  if (s >= 90 && (samhap >= 1 || yukhap >= 1))
    return { hanja: "天生緣分", hangul: "천생연분", meaning: "하늘이 맺어준 인연", image: "016_사자성어_천생연분.png" };
  if (s >= 88 && isSangsaeng && yukhap >= 1)
    return { hanja: "百年偕老", hangul: "백년해로", meaning: "백 년을 함께 늙어감", image: "017_사자성어_백년해로.jpeg" };
  if (s >= 85 && isSangsaeng)
    return { hanja: "夫唱婦隨", hangul: "부창부수", meaning: "서로를 따르는 조화로운 인연", image: "018_사자성어_부창부수.png" };
  if (s >= 85 && samhap >= 1)
    return { hanja: "一心同體", hangul: "일심동체", meaning: "한 마음 한 몸", image: "019_사자성어_일심동체.png" };
  // 70-84 양호
  if (s >= 75 && isBihwa)
    return { hanja: "和而不同", hangul: "화이부동", meaning: "다르지만 조화로움", image: "020_사자성어_화이부동.jpeg" };
  if (s >= 75 && yukhap >= 1)
    return { hanja: "水魚之交", hangul: "수어지교", meaning: "물과 물고기처럼 떨어질 수 없는 사이", image: "021_사자성어_수어지교.png" };
  if (s >= 72)
    return { hanja: "膠漆之交", hangul: "교칠지교", meaning: "아교와 옻처럼 단단히 붙은 인연", image: "022_사자성어_교칠지교.png" };
  if (s >= 70)
    return { hanja: "擧案齊眉", hangul: "거안제미", meaning: "서로 공경하는 인연", image: "023_사자성어_거안제미.png" };
  if (s >= 68)
    return { hanja: "以心傳心", hangul: "이심전심", meaning: "마음에서 마음으로 통함", image: "024_사자성어_이심전심.png" };
  // 50-69 노력형
  if (s >= 60 && chungs >= 1)
    return { hanja: "捲土重來", hangul: "권토중래", meaning: "흙먼지 일으키며 다시 일어섬", image: "025_사자성어_권토중래.jpeg" };
  if (s >= 55)
    return { hanja: "塞翁之馬", hangul: "새옹지마", meaning: "변화무쌍한 인연", image: "026_사자성어_새옹지마.png" };
  if (s >= 50)
    return { hanja: "同床異夢", hangul: "동상이몽", meaning: "같이 있어도 다른 꿈을 꾸는 사이", image: "027_사자성어_동상이몽.png" };
  // 50 미만 도전적
  if (s >= 40 && chungs >= 2)
    return { hanja: "氷炭之間", hangul: "빙탄지간", meaning: "얼음과 숯처럼 어울리기 힘든 사이", image: "028_사자성어_빙탄지간.png" };
  if (chungs >= 2 || isSanggeuk)
    return { hanja: "犬猿之間", hangul: "견원지간", meaning: "개와 원숭이처럼 부딪히는 사이", image: "029_사자성어_견원지간.png" };
  return { hanja: "風雲之會", hangul: "풍운지회", meaning: "바람과 구름이 만나는 운명적 인연", image: "030_사자성어_풍운지회.png" };
}

// ── 3. 섹션 배너 (15장) ──
// 슬라이드 구성에 따라 매핑 (12 슬라이드 기준)
export const MATCHING_BANNER = {
  intro:        "031_배너_만남.png",          // 슬라이드 0/1: 인트로
  essence:      "032_배너_본질.png",          // 두 사람의 본질
  ohaengSang:   "033_배너_오행상생.png",      // 우리 둘의 기운 (상생)
  ohaengGeuk:   "034_배너_오행상극.png",      // 우리 둘의 기운 (상극)
  iljiHap:      "035_배너_일지육합.png",      // 침실의 기운 (육합)
  iljiChung:    "036_배너_일지육충.png",      // 침실의 기운 (육충)
  samhap:       "037_배너_삼합운명.png",      // 인연의 깊이 (삼합)
  daeun:        "038_배너_대운동행.png",      // 함께하는 시간
  shadowLight:  "039_배너_그림자와빛.png",    // 관계의 그림자와 빛
  hongSil:      "040_배너_홍실인연.png",      // 홍도인 인트로/마무리
  prophecy:     "041_배너_시기예언.jpeg",     // 시기 예언
  bedroom:      "042_배너_침실의기운.png",    // 침실의 기운
  depth:        "043_배너_인연의깊이.png",    // 인연의 깊이
  language:     "044_배너_관계의언어.png",    // 관계의 언어
  closing:      "045_배너_마무리.png",        // 마무리
} as const;

// 섹션별 배너 자동 선택 (compat 데이터 기반)
export function pickBannerForSection(section: string, compat: CompatibilityResult): string {
  switch (section) {
    case "essence": return MATCHING_BANNER.essence;
    case "ohaeng": {
      const helps = compat.elementBalance.aHelpsB.length + compat.elementBalance.bHelpsA.length;
      return helps > 0 ? MATCHING_BANNER.ohaengSang : MATCHING_BANNER.ohaengGeuk;
    }
    case "language": return MATCHING_BANNER.language;
    case "bedroom": {
      const ilji = compat.branchRelations.ilji;
      if (ilji.includes("육합") || ilji.includes("삼합")) return MATCHING_BANNER.iljiHap;
      if (ilji.includes("충") || ilji.includes("형")) return MATCHING_BANNER.iljiChung;
      return MATCHING_BANNER.bedroom;
    }
    case "depth": {
      return compat.branchRelations.samhap.length > 0 ? MATCHING_BANNER.samhap : MATCHING_BANNER.depth;
    }
    case "time": return MATCHING_BANNER.daeun;
    case "shadow": return MATCHING_BANNER.shadowLight;
    case "intro": return MATCHING_BANNER.intro;
    case "closing": return MATCHING_BANNER.closing;
    case "hongsil": return MATCHING_BANNER.hongSil;
    case "prophecy": return MATCHING_BANNER.prophecy;
    default: return MATCHING_BANNER.intro;
  }
}

// ── 4. 인연꽃 (12장) — 점수·계절·오행 매칭 ──
export interface InyeonItem {
  name: string;
  meaning: string;
  image: string;
}
export function pickInyeonKkot(compat: CompatibilityResult, monthBranch?: string): InyeonItem {
  const s = compat.score;
  // 점수 우선
  if (s >= 90) return { name: "장미", meaning: "정열과 깊은 사랑", image: "046_인연꽃_장미.png" };
  if (s >= 85) return { name: "백합", meaning: "순결한 헌신", image: "047_인연꽃_백합.png" };
  if (s >= 80) return { name: "동백", meaning: "변치 않는 사랑", image: "048_인연꽃_동백.jpeg" };
  if (s >= 75) return { name: "연꽃", meaning: "초월적이고 깊은 사랑", image: "057_인연꽃_연꽃.png" };
  if (s >= 70) return { name: "국화", meaning: "성숙하고 고결한 사랑", image: "056_인연꽃_국화.png" };
  // 계절 (월지 기준)
  if (monthBranch && ["인", "묘"].includes(monthBranch))
    return { name: "매화", meaning: "겨울을 이겨내는 강인한 사랑", image: "049_인연꽃_매화.png" };
  if (monthBranch && ["진", "사"].includes(monthBranch))
    return { name: "벚꽃", meaning: "찰나의 아름다움", image: "052_인연꽃_벚꽃.png" };
  if (monthBranch && ["오", "미"].includes(monthBranch))
    return { name: "해바라기", meaning: "한 방향으로 향하는 사랑", image: "051_인연꽃_해바라기.png" };
  if (monthBranch && ["신", "유"].includes(monthBranch))
    return { name: "수국", meaning: "변화하는 감정의 사랑", image: "050_인연꽃_수국.jpeg" };
  if (monthBranch && ["술", "해"].includes(monthBranch))
    return { name: "달리아", meaning: "기품 있는 사랑", image: "054_인연꽃_달리아.png" };
  // fallback
  return { name: "라일락", meaning: "첫사랑의 순수함", image: "053_인연꽃_라일락.png" };
}

// ── 5. 인연석 (10장) — 부족 오행 보완 ──
export function pickInyeonSeok(compat: CompatibilityResult): InyeonItem {
  const weak = compat.elementBalance.sharedWeak[0];
  const score = compat.score;
  // 부족 오행 우선
  if (weak === "화") return { name: "루비", meaning: "정열과 따뜻함을 채우는 보석", image: "058_인연석_루비.png" };
  if (weak === "수") return { name: "자수정", meaning: "지혜와 평온을 채우는 보석", image: "059_인연석_자수정.png" };
  if (weak === "금") return { name: "진주", meaning: "균형과 조화를 채우는 보석", image: "060_인연석_진주.png" };
  if (weak === "목") return { name: "에메랄드", meaning: "성장과 생명력을 채우는 보석", image: "063_인연석_에메랄드.png" };
  if (weak === "토") return { name: "산호", meaning: "안정과 활력을 채우는 보석", image: "067_인연석_산호.png" };
  // 점수별
  if (score >= 90) return { name: "다이아몬드", meaning: "영원히 변치 않는 인연", image: "066_인연석_다이아몬드.png" };
  if (score >= 80) return { name: "로즈쿼츠", meaning: "조건 없는 사랑", image: "062_인연석_로즈쿼츠.png" };
  if (score >= 70) return { name: "문스톤", meaning: "직관적으로 통하는 인연", image: "061_인연석_문스톤.png" };
  if (score >= 60) return { name: "오팔", meaning: "다채로운 매력이 만나는 인연", image: "064_인연석_오팔.png" };
  return { name: "터키석", meaning: "서로를 지켜주는 보호의 인연", image: "065_인연석_터키석.png" };
}

// ── 6. 공유 무드 배경 (10장) — 점수대 ──
export function pickShareCardBg(score: number, mood?: string): string {
  if (mood === "운명") return "072_공유_무드_운명적.png";
  if (mood === "신비") return "073_공유_무드_신비.png";
  if (mood === "격정") return "076_공유_무드_격정.png";
  if (score >= 90) return "074_공유_무드_황홀.png";
  if (score >= 80) return "068_공유_무드_화려.png";
  if (score >= 70) return "069_공유_무드_따뜻.png";
  if (score >= 60) return "071_공유_무드_시적.png";
  if (score >= 50) return "070_공유_무드_잔잔.png";
  if (score >= 40) return "075_공유_무드_고요.png";
  return "077_공유_무드_영원.png";
}

// ── 7. 키워드 매칭 이미지 (40장) — AI 본문 스캔 ──
export const MATCHING_KEYWORD_IMAGE: Array<{ m: string[]; img: string }> = [
  { m: ["운명적 만남", "운명의 만남", "운명처럼 만"], img: "078_키워드_운명적만남.png" },
  { m: ["첫 만남", "처음 만났", "처음 보았"],         img: "079_키워드_첫만남.png" },
  { m: ["고백", "마음을 전"],                          img: "080_키워드_고백.png" },
  { m: ["결혼", "혼인"],                                img: "081_키워드_결혼.png" },
  { m: ["평생 약속", "평생을 함께", "평생의 맹세"],   img: "082_키워드_평생약속.png" },
  { m: ["이별", "헤어짐"],                              img: "083_키워드_이별.png" },
  { m: ["헤어진", "떠나간"],                            img: "084_키워드_헤어짐.png" },
  { m: ["재회", "다시 만나", "다시 만"],               img: "085_키워드_재회.png" },
  { m: ["그리움", "그리워"],                            img: "086_키워드_그리움.png" },
  { m: ["질투", "시기"],                                img: "087_키워드_질투.png" },
  { m: ["안정", "평온", "평안"],                       img: "088_키워드_안정.png" },
  { m: ["갈등", "충돌", "다툼"],                       img: "089_키워드_갈등.png" },
  { m: ["화해", "용서"],                                img: "090_키워드_화해.png" },
  { m: ["신뢰", "믿음"],                                img: "091_키워드_신뢰.png" },
  { m: ["거리감", "멀어짐"],                            img: "092_키워드_거리감.png" },
  { m: ["황금기", "전성기", "꽃피"],                   img: "093_키워드_황금기.png" },
  { m: ["위기", "시련"],                                img: "094_키워드_위기.png" },
  { m: ["전환점", "터닝포인트", "변화의 시기"],        img: "095_키워드_전환점.png" },
  { m: ["봄", "새로운 시작"],                           img: "096_키워드_봄날.png" },
  { m: ["여름밤", "여름"],                              img: "097_키워드_여름밤.png" },
  { m: ["가을"],                                        img: "098_키워드_가을빛.png" },
  { m: ["겨울", "추운 시기"],                           img: "099_키워드_겨울새벽.png" },
  { m: ["달빛", "달 아래"],                             img: "100_키워드_달빛산책.png" },
  { m: ["별자리", "운명의 별"],                        img: "101_키워드_별자리.png" },
  { m: ["소나기"],                                      img: "102_키워드_소나기.png" },
  { m: ["노을", "석양"],                                img: "103_키워드_노을.png" },
  { m: ["새벽", "동트"],                                img: "104_키워드_새벽길.png" },
  { m: ["단풍"],                                        img: "105_키워드_단풍.png" },
  { m: ["첫눈", "눈 내"],                              img: "106_키워드_첫눈.png" },
  { m: ["운명의 실", "홍실"],                          img: "107_키워드_운명실.png" },
  { m: ["인연의 끈", "끈으로 묶"],                     img: "108_키워드_인연끈.png" },
  { m: ["두 그림자", "두 사람의 그림자"],              img: "109_키워드_두그림자.png" },
  { m: ["손을 잡", "손잡"],                            img: "110_키워드_손잡기.png" },
  { m: ["포옹", "안아"],                                img: "111_키워드_포옹.png" },
  { m: ["눈을 마주", "마주보"],                        img: "112_키워드_눈맞춤.png" },
  { m: ["등을 돌", "외면"],                             img: "113_키워드_등돌림.png" },
  { m: ["편지", "서신"],                                img: "114_키워드_편지.png" },
  { m: ["약속", "맹세"],                                img: "115_키워드_약속.png" },
  { m: ["기다림", "기다리"],                            img: "116_키워드_기다림.png" },
  { m: ["떠남", "떠나"],                                img: "117_키워드_떠남.png" },
];

export function pickKeywordImage(text: string): string | null {
  for (const { m, img } of MATCHING_KEYWORD_IMAGE) {
    if (m.some((kw) => text.includes(kw))) return img;
  }
  return null;
}

// ── 텍스트 페이지 분할 (평생사주 splitIntoPages 동등 기능 — 별도 구현) ──
// 평생사주 컴포넌트를 건드리지 않기 위해 동등한 함수를 여기 따로 둠.
export function splitIntoPages(text: string): string[] {
  // ### 또는 ▶ 기준으로 섹션 분리
  const sections = text.split(/(?=^###\s|^▶\s)/m).map((s) => s.trim()).filter((s) => s);
  if (sections.length > 1) {
    // 내용 없는 섹션(제목만 있는 경우) 다음 섹션과 합치기
    const merged: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const contentLines = s.split("\n").map((l) => l.trim()).filter(
        (l) => l && !l.startsWith("###") && !l.startsWith("▶")
      );
      if (contentLines.length === 0 && i < sections.length - 1) {
        sections[i + 1] = s + "\n" + sections[i + 1];
      } else {
        merged.push(s);
      }
    }
    // 단락이 여러 개면 추가 분할
    const result: string[] = [];
    for (const page of merged) {
      const titleMatch = page.match(/^(###\s.*|▶\s.*)\n/);
      const title = titleMatch ? titleMatch[0] : "";
      const body = title ? page.slice(title.length) : page;
      const paras = body.split(/\n{2,}/).map((s) => s.trim()).filter((s) => s);
      if (paras.length > 1) {
        result.push(title + paras[0]);
        for (const p of paras.slice(1)) result.push(p);
      } else {
        result.push(page);
      }
    }
    return result.length > 0 ? result : [text];
  }
  // ### 없으면 빈 줄 기준
  const paragraphs = text.split(/\n{2,}/).map((s) => s.trim()).filter((s) => s);
  if (paragraphs.length > 1) return paragraphs;
  return [text];
}
