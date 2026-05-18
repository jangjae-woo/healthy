// 17p 보고서 렌더 (Phase 4)
//
// facts JSON만으로 정적 렌더. LLM 산문 자리는 placeholder.
// LLM 없이도 보고서 폼이 완성돼야 통과.
//
// 작성: 2026-05-16

import {
  renderRadar, renderScoreBars, renderSingleScoreBar,
  renderBipolarAccordion, renderSaju8Box, renderFactorCards,
  renderTriangleSVG, renderMatrixCard, renderMatrixCardRich, llmPlaceholder,
  FACTOR_COLORS, FACTOR_SHORT, formatSajuInfo,
} from './render-utils.mjs';
import {
  fiveLevelFromScore,
  getCompatibilityTextBlock,
  getFactorTextBlock,
  getMatrixComboTextBlock,
  getMatrixCardTextBlock,
  getParentSajuTextBlock,
} from './block-cache.mjs';

const LEVEL_KO = { low: '낮음', mid: '중간', high: '높음' };

function hasBatchim(text) {
  const ch = text.charCodeAt(text.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return false;
  return (ch - 0xac00) % 28 !== 0;
}

function josa(text, batchim, noBatchim) {
  return hasBatchim(text) ? batchim : noBatchim;
}

// LLM 본문 helper — facts.llmText[key] 있으면 인용, 없으면 placeholder
function llm(facts, key, placeholderText) {
  const text = facts.llmText?.[key];
  if (text) {
    const html = text.split(/\n+/).map(p => `<p style="margin:8px 0;">${p}</p>`).join('');
    return `<div class="llm-content">${html}</div>`;
  }
  return llmPlaceholder(placeholderText);
}

// 양육 Tip 본문을 3개 카드로 분할한다.
// 예: "🕐 시간 — 에너지 회복 루틴 만들기\n본문" 또는 "🕐 시간\n본문"
function parseTipText(text) {
  if (!text) return null;
  const result = { items: [] };
  const sections = text.split(/(?=🕐|💬|🌿)/);
  for (const s of sections) {
    const cleaned = s.trim();
    if (!cleaned) continue;
    const m = cleaned.match(/^(🕐|💬|🌿)\s*(시간|소통|환경)?\s*(?:[—-]\s*([^\n]+))?\n+([\s\S]+)$/);
    if (!m) continue;
    const axis = m[2] ?? '';
    const fallbackTitle = cleaned.startsWith('🕐') ? '시간' : cleaned.startsWith('💬') ? '소통' : '환경';
    const item = {
      icon: m[1],
      axis,
      title: (m[3] || fallbackTitle).trim(),
      desc: m[4].trim(),
    };
    result.items.push(item);
    if (cleaned.startsWith('🕐')) result.time = item.desc;
    else if (cleaned.startsWith('💬')) result.communication = item.desc;
    else if (cleaned.startsWith('🌿')) result.environment = item.desc;
  }
  return result;
}

const TRACE_LABELS = {
  식상: '표현하고 움직이게 하는 기운<br/><span class="trace-note">(식상·<span class="han">食傷</span>)</span>',
  양인: '결단하고 치고 나가는 기운<br/><span class="trace-note">(양인·<span class="han">羊刃</span>)</span>',
  신강: '자기 에너지가 단단한 결<br/>(신강)',
  화: '밝고 빠르게 드러나는 불의 결<br/><span class="trace-note">(화·<span class="han">火</span> 오행)</span>',
  목: '자라나고 뻗어가는 나무의 결<br/><span class="trace-note">(목·<span class="han">木</span> 오행)</span>',
  양일간: '밖으로 뻗어가는 양일간의 결<br/>(양일간)',
  역마살: '움직임과 이동성을 여는 기운<br/>(역마·<span class="han">驛馬</span>)',
  '12운성 강세': '에너지가 살아나는 자리<br/>(12운성 강세)',
  음일간: '안으로 들이는 부드러운 일간<br/>(음일간)',
  수: '사주 가운데에 자리한 깊은 물의 결<br/><span class="trace-note">(수·<span class="han">水</span> 오행 강세)</span>',
  인성: '받쳐주는 기운이 강해 표현의 결을 누름<br/><span class="trace-note">(인성·<span class="han">印星</span> 강)</span>',
  '12운성 약세': '에너지가 잠긴 자리<br/>(12운성 약세)',
  관성: '절제하는 기운<br/><span class="trace-note">(관성·<span class="han">官星</span>)</span>',
  토: '단단히 받쳐주는 흙의 결<br/><span class="trace-note">(토·<span class="han">土</span> 오행)</span>',
  화개살: '안으로 깊어지는 기운<br/><span class="trace-note">(화개·<span class="han">華蓋</span>)</span>',
  '관성 무존재': '절제 기운이 약한 자리<br/>(관성 없음)',
  '식상 강': '표현 기운이 앞서는 자리<br/>(식상 강)',
  조후: '따뜻함과 차가움의 균형<br/><span class="trace-note">(조후·<span class="han">調候</span>)</span>',
  천을귀인: '부드럽게 보호하는 상서로운 기운<br/><span class="trace-note">(천을귀인·<span class="han">天乙貴人</span>)</span>',
  관인상생: '절제와 받침이 이어지는 흐름<br/>(관인상생)',
  문창귀인: '섬세하게 알아차리는 기운<br/><span class="trace-note">(문창귀인·<span class="han">文昌</span>)</span>',
  일주: '마음 자리의 안정 흐름<br/>(일주 안정)',
  충: '흔들리는 결이 마음 자리에 자리<br/><span class="trace-note">(충·<span class="han">沖</span>)</span>',
  해: '속으로 스미는 불편감<br/><span class="trace-note">(해·<span class="han">害</span>)</span>',
  원진: '오래 남는 감정의 결<br/><span class="trace-note">(원진·<span class="han">怨嗔</span>)</span>',
  형: '긴장을 만드는 관계 자리<br/><span class="trace-note">(형·<span class="han">刑</span>)</span>',
  합: '자연스럽게 통하는 결<br/><span class="trace-note">(합·<span class="han">合</span>)</span>',
  도화살: '사람을 끌어들이는 기운<br/>(도화·<span class="han">桃花</span>)',
  비겁: '자기 결을 밀고 가는 기운<br/>(비겁·<span class="han">比劫</span>)',
};

function traceTitle(line) {
  const body = line.replace(/^[+-]\s*/, '').split(':')[0].trim();
  const key = Object.keys(TRACE_LABELS).find(k => body.includes(k));
  return TRACE_LABELS[key] ?? body.replace(/\s*(본기|상조|여기|정액).*$/, '의 기운');
}

function traceWeight(line) {
  const m = line.match(/=\s*(-?\d+(?:\.\d+)?)/);
  return m ? Math.abs(Number(m[1])) : 1;
}

function factorEvidenceItems(f, sign) {
  return (f.trace ?? [])
    .filter(line => line.trim().startsWith(sign))
    .filter(line => traceWeight(line) > 0.5)
    .map(line => traceTitle(line))
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .slice(0, 5);
}

function renderFactorEvidenceTable(facts, factorKey) {
  const f = facts.childFactors[factorKey];
  const factorKo = f.factorKorean;
  const positive = factorEvidenceItems(f, '+');
  const negative = factorEvidenceItems(f, '-');
  const obj = josa(factorKo, '을', '를');
  const posItems = positive.length ? positive : [`${factorKo}${obj} 직접 키우는 기운은 은은하게 자리합니다`];
  const negItems = negative.length ? negative : [`${factorKo}${obj} 크게 누르는 기운은 두드러지지 않습니다`];

  return `
    <div class="factor-table">
      <h4>📊 ${facts.child.fullTitle}의 ${factorKo}에 작용한 사주 인자</h4>
      <div class="factor-row">
        <div class="factor-positive">
          <span class="ftitle">${factorKo}${obj} 만드는 기운</span>
          <ul>${posItems.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>
        <div class="factor-negative">
          <span class="ftitle">${factorKo}${obj} 누르는 기운</span>
          <ul>${negItems.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `;
}

function renderFactorMechanism(facts, factorKey) {
  const f = facts.childFactors[factorKey];
  const factorKo = f.factorKorean;
  const positive = factorEvidenceItems(f, '+').length;
  const negative = factorEvidenceItems(f, '-').length;
  const obj = josa(factorKo, '을', '를');
  const c = negative > positive
    ? `${factorKo}${obj} 만드는 기운 ${positive || 1}가지보다 누르는 기운 ${negative}가지가 우세하기 때문에, ${facts.child.fullTitle}의 ${factorKo}${josa(factorKo, '은', '는')} 또래보다 안으로 흐르는 결이 됩니다.`
    : `${factorKo}${obj} 만드는 기운이 누르는 기운보다 또렷하게 자리하기 때문에, ${facts.child.fullTitle}의 ${factorKo}${josa(factorKo, '은', '는')} 일상에서 비교적 선명하게 드러나는 결이 됩니다.`;

  return `
    <p>
      ${factorKo}${obj} 가장 크게 만드는 기운과 누르는 기운을 함께 보면, ${facts.child.fullTitle}의 ${factorKo}${josa(factorKo, '이', '가')} 어느 방향으로 흐르는지 보입니다. 만드는 기운은 자녀의 결을 앞으로 밀어 주고, 누르는 기운은 그 속도와 표현을 안쪽으로 조절합니다.
    </p>
    <p>${c}</p>
  `;
}

function renderFactorRichInterpretation(facts, factorKey) {
  const f = facts.childFactors[factorKey];
  const factorKo = f.factorKorean;
  const child = facts.child.fullTitle;
  const score = f.score;
  const level = f.level;
  const levelText = LEVEL_KO[level];
  const obj = josa(factorKo, '을', '를');
  const sub = level === 'low'
    ? `${factorKo}${obj} 앞으로 크게 밀어내는 힘보다, 안쪽으로 조절하거나 잠시 멈추게 하는 힘이 더 먼저 작용합니다.`
    : `${factorKo}${obj} 밖으로 드러내는 힘이 비교적 선명하고, 아이의 표정과 행동 속에서 이 결이 쉽게 관찰됩니다.`;
  const daily = level === 'low'
    ? `그래서 일상에서는 ${child}이 바로 반응하기보다 먼저 살피고, 익숙한 흐름이 만들어진 뒤에야 자기 속도를 내는 장면이 자연스럽습니다.`
    : `그래서 일상에서는 ${child}이 이 결이 드러나는 상황을 만나면 반응이 빠르게 살아나고, 주변 어른도 비교적 쉽게 알아차릴 수 있습니다.`;
  const care = level === 'low'
    ? `부족하다고 밀어 올리기보다, 아이가 편안하게 꺼낼 수 있는 자리와 시간을 만들어주는 쪽이 좋습니다.`
    : `강점으로 살리되 과하게 몰아붙이지 않도록, 중간중간 쉬어갈 신호를 함께 주는 쪽이 좋습니다.`;

  return `
    <div style="background:#fffaf4;border:1px solid #f0d9c4;border-radius:10px;padding:14px 16px;margin:12px 0;font-size:13px;line-height:1.9;color:#4d4037;">
      <p><strong>${child}의 ${factorKo} ${score}점</strong>은 단순히 ${levelText}이라는 한 단어로 끝나는 결과가 아닙니다. 사주 안에서 ${factorKo}${obj} 만드는 기운과 조절하는 기운이 함께 놓이면서, 지금처럼 보이는 결로 정리된 것입니다.</p>
      <p>${sub} 이 흐름은 아이가 일부러 그렇게 행동한다는 뜻이 아니라, 타고난 결이 상황을 만났을 때 먼저 열리는 방향을 보여줍니다.</p>
      <p>${daily} ${care}</p>
    </div>
  `;
}

const DAILY_SCENES = {
  hwalgi: {
    low: '키즈카페에 가도 미끄럼틀이나 트램펄린보다 한쪽 구석에 앉아서 색종이를 접거나 스티커를 붙이며 시간을 보냅니다. 친구들이 뛰어놀자고 해도 잠깐 따라갔다가 금세 다시 앉아서 자기 손으로 만지작거리는 놀이로 돌아옵니다.<br/><br/>저녁에 부모님이 책을 읽어주실 때 한 자리에 오래 앉아 있는 결이 다른 아이보다 자연스럽고, 활동량 많은 외출 후엔 평소보다 쉽게 지치고 잠도 빨리 듭니다. 또래가 자전거·킥보드를 좋아할 나이에도 그림책·찰흙·역할 놀이를 더 오래 즐기는 결입니다.',
    mid: '놀이터에 가면 처음에는 신나게 뛰지만 오래 몰아붙이면 금세 얼굴이 지치거나 말수가 줄어듭니다. 친구들을 따라 뛰다가도 물을 마시거나 벤치에 앉아 쉬는 시간이 있어야 다시 자기 속도로 움직입니다.<br/><br/>외출이 길어진 날에는 집에 돌아와 조용한 놀이를 찾고, 다음 활동으로 바로 넘기면 짜증이 늘 수 있습니다. 짧게 뛰고 잠깐 쉬는 리듬을 주면 활기가 가장 자연스럽게 살아납니다.',
    high: '아침부터 몸이 먼저 움직이고, 집 안에서도 뛰거나 오르거나 밀고 당기는 놀이를 먼저 찾습니다. 놀이터에서는 미끄럼틀을 여러 번 타고, 계단이나 낮은 구조물을 오르내리며 에너지를 풀 때 표정이 가장 밝아집니다.<br/><br/>움직임을 오래 막으면 말이 빨라지거나 손이 바빠질 수 있습니다. 하루 중 큰 움직임을 먼저 열어 주면 식사·목욕·수면 같은 다음 흐름도 훨씬 안정됩니다.',
  },
  josim: {
    low: '처음 보는 장난감이나 놀이기구 앞에서도 먼저 손을 뻗고, 새 친구가 다가오면 겁내기보다 바로 말을 걸거나 따라가는 일이 많습니다. 낯선 장소에서도 금세 안쪽으로 들어가 보려 하고, 궁금한 것은 몸이 먼저 움직입니다.<br/><br/>이 결은 빠르게 적응하는 장점이 있지만 안전선을 말로만 설명하면 이미 행동이 앞서갈 수 있습니다. "여기까지만", "손잡고 가자"처럼 짧고 분명한 신호가 함께 있어야 더 안정됩니다.',
    mid: '처음 보는 장소에서는 잠깐 부모님 옆에 붙어 있다가, 분위기를 확인한 뒤 천천히 움직이기 시작합니다. 새 친구가 먼저 다가오면 바로 뛰어들기보다 표정과 행동을 살핀 뒤 자기 속도로 반응합니다.<br/><br/>처음 몇 분의 관찰 시간이 지나면 놀이에 잘 들어갈 수 있으니, 곧바로 밀어 넣기보다 곁에서 안전 신호를 주고 조금 뒤 물러나는 방식이 좋습니다.',
    high: '새 사람이나 새 장소 앞에서 먼저 멈춰 서고, 부모님 손을 잡거나 뒤에 서서 한참 살피는 모습이 자연스럽습니다. 어린이집 반 변경, 새 수업, 처음 가는 키즈카페처럼 환경이 바뀌면 다른 아이보다 적응에 시간이 필요합니다.<br/><br/>바로 참여시키면 몸이 굳거나 표정이 닫힐 수 있습니다. 충분히 둘러보고, 익숙한 어른의 설명을 들은 뒤에야 자녀의 결이 부드럽게 풀립니다.',
  },
  manjok: {
    low: '새 장난감을 선물 받아도 "와!" 하고 환하게 웃기보다 가만히 받아서 한참 들여다본 뒤에야 만지기 시작합니다. 칭찬을 받아도 살짝 미소만 짓고 마는 경우가 많고, 다른 아이가 신나게 노래 부를 때도 옆에서 조용히 듣고만 있을 수 있습니다.<br/><br/>좋아하는 결이 분명히 있어도 바깥으로 환하게 표현하기보다 안에서 곱씹는 편입니다. 사진을 찍을 때도 크게 웃는 표정이 잘 안 나오고, 좋은 일이 있어도 "좋아!"를 바로 말하지 않을 수 있습니다.',
    mid: '좋고 싫음이 상황에 따라 천천히 드러납니다. 새 장난감을 바로 끌어안기보다 들여다보고 만져본 뒤 마음에 들면 오래 곁에 두는 식으로 만족을 표현합니다.<br/><br/>크게 반응하지 않아도 살짝 웃거나 같은 놀이를 다시 찾는 순간이 만족 신호입니다. 부모님이 이런 작은 신호를 먼저 알아채 주면 자녀의 좋은 감정이 한 박자 더 따뜻하게 열립니다.',
    high: '작은 선물이나 짧은 칭찬에도 얼굴이 밝아지고, 좋아하는 놀이를 만나면 주변 사람에게 보여주고 싶어 하는 결입니다. 맛있는 간식, 마음에 드는 색, 재미있는 장면을 발견하면 그 즐거움이 표정과 말로 빠르게 드러납니다.<br/><br/>좋은 감정이 잘 퍼지는 만큼 흥분도 쉽게 커질 수 있습니다. 즐거운 장면을 함께 이름 붙여 주고, 끝나는 신호를 부드럽게 주면 밝은 결이 오래 안정됩니다.',
  },
  heundeullim: {
    low: '마음의 파도가 비교적 잔잔해 큰 자극 뒤에도 빨리 자기 자리로 돌아오는 편입니다. 장난감을 잃어버리거나 친구와 부딪혀도 잠깐 속상해한 뒤 다른 놀이로 넘어갈 수 있습니다.<br/><br/>다만 감정이 작게 보인다고 없는 것은 아닙니다. 큰 외출이나 낯선 경험 뒤에는 "놀랐지", "괜찮았어?"처럼 짧게 확인해 주면 자녀가 자기 마음을 놓치지 않습니다.',
    mid: '속상한 일이 생기면 바로 잊기보다 한동안 표정이나 말투에 남을 수 있습니다. 울음이나 짜증이 올라온 뒤에는 설명을 많이 듣기보다 물 마시기, 안기, 조용한 놀이처럼 마음을 내릴 시간이 필요합니다.<br/><br/>큰 행사나 외출 뒤에는 평소보다 예민해지거나 잠드는 데 시간이 걸릴 수 있습니다. 한 박자 쉬고 다시 정리할 공간을 주면 흔들림이 부드럽게 가라앉습니다.',
    high: '잃어버린 장난감 자리에서 오래 머물며 다시 찾아보려 하고, 부모님이 잠시 자리를 비웠던 일을 저녁 잠자리에서 다시 묻기도 합니다. 한 번 야단을 들으면 바로 풀리지 않고 한참 동안 시무룩한 채로 따라다닐 수 있습니다.<br/><br/>새 환경에 가면 적응까지 시간이 오래 걸리고, 가족 여행·생일 파티 같은 큰 자극 후엔 며칠 동안 컨디션이 회복되지 않기도 합니다. 슬픈 장면이 있는 동화책을 읽어도 한참 그 감정을 따라가는 결입니다.',
  },
  eoullim: {
    low: '혼자 노는 시간이 편하고 자기 페이스가 분명합니다. 친구들이 함께 놀자고 해도 잠깐 어울린 뒤 자기 장난감이나 책으로 돌아오는 모습이 자연스럽습니다.<br/><br/>사람이 많은 자리에서는 말수가 줄거나 부모님 곁에 머무는 시간이 길어질 수 있습니다. 함께 놀기를 강요하기보다 짧은 만남 뒤 혼자 정리할 시간을 주면 관계가 더 편안해집니다.',
    mid: '친구와 함께 놀 때 즐거워하지만, 계속 관계 안에만 있으면 금세 피곤해질 수 있습니다. 어린이집에서 친구들과 논 뒤 집에 오면 혼자 그림을 그리거나 책을 보는 시간으로 마음을 정리합니다.<br/><br/>관계와 자기 시간이 모두 필요한 결입니다. 함께한 뒤 혼자 돌아오는 자리를 마련해 주면 자녀의 어울림이 더 안정적으로 자랍니다.',
    high: '친구가 울면 자기 일처럼 옆에 가서 손을 잡거나 안아주고, 부모님 표정이 어두우면 금세 알아채고 먼저 다가옵니다. 혼자 노는 시간보다 친구와 함께 그림을 그리거나 역할 놀이를 하는 시간을 환하게 즐깁니다.<br/><br/>가족 모임에서도 분위기를 잘 읽고 어른들 사이에 자연스럽게 섞이는 모습이 보입니다. 다만 타인의 감정을 깊이 받는 결이라, 함께한 뒤에는 자기 마음을 비울 시간이 꼭 필요합니다.',
  },
  kkeungi: {
    low: '관심이 여러 곳으로 자유롭게 옮겨갑니다. 블록을 쌓다가 그림책을 보고, 다시 자동차 놀이로 넘어가는 식으로 흐름이 가볍게 바뀔 수 있습니다.<br/><br/>하나를 오래 붙잡지 않는다고 부족한 것은 아닙니다. 짧게 끝나는 과제를 나누고, 지금 보이는 선택지를 줄여 주면 자녀가 자기 방식으로 집중을 경험하기 쉽습니다.',
    mid: '좋아하는 일에는 제법 오래 머물지만 흐름이 끊기면 다시 잡는 데 시간이 걸립니다. 퍼즐이나 그림처럼 마음에 든 활동은 끝까지 가려 하지만, 갑자기 부르면 집중이 풀릴 수 있습니다.<br/><br/>"이 줄까지만", "모래시계 끝날 때까지"처럼 시작과 끝을 작게 보이게 해주면 좋습니다. 자기 페이스를 인정받을 때 끈기가 안정적으로 이어집니다.',
    high: '퍼즐을 시작하면 다 맞출 때까지 오래 자리에 앉아 있고, 그림을 그릴 때도 중간에 다른 놀이로 넘어가지 않고 한 장을 끝까지 마무리합니다. "잠깐만 기다려"라는 말을 다른 아이보다 잘 기억하고 기다릴 수 있습니다.<br/><br/>아침부터 자기 전까지 일과를 비슷한 순서로 반복하길 좋아하고, 한 번 배운 노래나 책 내용을 오래 기억합니다. 새 장난감보다 자기가 좋아하는 장난감을 계속 가지고 노는 결입니다.',
  },
};

function renderDailyScene(facts, factorKey) {
  const f = facts.childFactors[factorKey];
  const c = FACTOR_COLORS[factorKey];
  const text = DAILY_SCENES[factorKey]?.[f.level] ?? DAILY_SCENES[factorKey]?.mid ?? '';
  return `
    <p style="background:${c.light};padding:14px 18px;border-radius:8px;border-left:3px solid ${c.main};">
      <strong>일상에서는…</strong><br/>
      ${text}
    </p>
  `;
}

function renderCachedDailyScene(facts, factorKey, block) {
  if (!block?.dailyBody?.length) return renderDailyScene(facts, factorKey);
  const c = FACTOR_COLORS[factorKey];
  return `
    <p style="background:${c.light};padding:14px 18px;border-radius:8px;border-left:3px solid ${c.main};">
      <strong>일상에서는…</strong><br/>
      ${block.dailyBody.join('<br/><br/>')}
    </p>
  `;
}

function renderTipItem(tipParts, index, defaultTitle, placeholder) {
  const item = tipParts?.items?.[index];
  const title = item?.title ?? defaultTitle;
  const desc = item?.desc ? item.desc.replace(/\n/g, '<br/>') : llmPlaceholder(placeholder);
  return `
    <div class="tip-item">
      <div class="tip-title">${title}</div>
      <div class="tip-desc">${desc}</div>
    </div>
  `;
}

function renderCachedTipItem(item, fallbackTipParts, index, defaultTitle, placeholder) {
  if (!item?.body) return renderTipItem(fallbackTipParts, index, defaultTitle, placeholder);
  return `
    <div class="tip-item">
      <div class="tip-title">${item.title ?? defaultTitle}</div>
      <div class="tip-desc">${item.body.replace(/\n/g, '<br/>')}</div>
    </div>
  `;
}

// p.1 표지
export function renderPage1Cover(facts) {
  return `
    <div class="page cover">
      <div class="page-num">Page 1</div>
      <div class="title">${facts.child.fullTitle}의 결</div>
      <div class="subtitle">사주로 본 아이의 여섯 가지 결과<br/>부모와의 궁합 보고서</div>
      <div class="info">
        검사일 ${facts.meta.testDate}<br/>
        ${facts.child.gender === 'female' ? '여' : '남'} · ${facts.child.age}<br/>
        ${facts.mother ? `어머님 ${facts.mother.name}` : ''}${facts.mother && facts.father ? ' · ' : ''}${facts.father ? `아버님 ${facts.father.name}` : ''}
      </div>
      <div class="jado-mark">— 자도인(慈道人) —</div>
    </div>
  `;
}

// p.2 도입
export function renderPage2Intro(facts) {
  return `
    <div class="page">
      <div class="page-num">Page 2</div>
      <div class="chapter-header ch-outro">보고서 소개</div>
      <p>자도인입니다.</p>
      <p>본 보고서는 ${facts.child.fullTitle}의 사주를 <strong>여섯 가지 결</strong>로 풀이하고, ${facts.meta.hasMother && facts.meta.hasFather ? '어머님·아버님' : facts.meta.hasMother ? '어머님' : '아버님'}의 사주에서 도출한 결과 어떻게 만나는지 — <strong>부모와의 궁합</strong>까지 함께 살펴봅니다.</p>
      <h3>보고서 구성</h3>
      <table>
        <tr><td>1장</td><td>본질결</td></tr>
        <tr><td>2장</td><td>활기</td></tr>
        <tr><td>3장</td><td>조심</td></tr>
        <tr><td>4장</td><td>만족</td></tr>
        <tr><td>5장</td><td>흔들림</td></tr>
        <tr><td>6장</td><td>어울림</td></tr>
        <tr><td>7장</td><td>끈기</td></tr>
        <tr><td>8장</td><td>동물 유형 자세히 살펴보기</td></tr>
        ${facts.meta.hasMother ? '<tr><td>9장</td><td>어머님 사주의 결</td></tr>' : ''}
        ${facts.meta.hasFather ? '<tr><td>10장</td><td>아버님 사주의 결</td></tr>' : ''}
        <tr><td>11장</td><td>부모-자녀 사주 궁합</td></tr>
        <tr><td>12장</td><td>함께 살펴줄 결</td></tr>
        <tr><td>outro</td><td>자도인의 마지막 당부</td></tr>
      </table>
      <div class="disclaimer">
        ※ 본 보고서의 사주 풀이는 타고난 결을 분석한 것이며, 실제 행동·양육은 환경·경험·선택에 따라 달라질 수 있습니다. 의학적 진단·치료가 아닙니다.
      </div>
    </div>
  `;
}

// p.3 자녀 6요인 한눈에
export function renderPage3Overview(facts) {
  return `
    <div class="page">
      <div class="page-num">Page 3</div>
      <div class="chapter-header ch-outro">1장 — ${facts.child.fullTitle}의 결 한눈에</div>
      <div class="score-box">
        ${facts.child.fullTitle}은 다음 6가지 결을 타고난 아이입니다.<br/>
        도드라진 결과 은은한 결을 함께 살피며 자라요.
      </div>
      <div class="radar-wrap">${renderRadar(facts.childFactors)}</div>
      ${renderScoreBars(facts.childFactors)}
      <div class="disclaimer">
        💡 여섯 결의 위치는 사주 원국에서 나온 인자 강도를 같은 기준으로 보정해 표시합니다.<br/>
        낮음 / 중간 / 높음은 좋고 나쁨이 아니라 ${facts.child.fullTitle}이 가진 결의 방향입니다.
      </div>
      <div class="bipolar-section">
        <div class="bipolar-title">각 요인별 수준에 따른 결의 특성</div>
        <div class="bipolar-subtitle">탭하면 전체 키워드가 펼쳐집니다</div>
        ${renderBipolarAccordion()}
      </div>
    </div>
  `;
}

// p.4~9 6요인 챕터 (공통)
function renderFactorChapter(facts, factorKey, pageNum, chapterNum) {
  const f = facts.childFactors[factorKey];
  const c = FACTOR_COLORS[factorKey];
  const factorKo = f.factorKorean;
  const makers = factorEvidenceItems(f, '+');
  const suppressors = factorEvidenceItems(f, '-');
  const cachedBlock = getFactorTextBlock({ facts, factorKey, makers, suppressors });
  const levelKo = cachedBlock?.level ?? fiveLevelFromScore(f.score);
  const shortText = cachedBlock?.summary ?? FACTOR_SHORT[factorKey][f.level === 'low' ? 'low' : 'high'];
  const chKey = `${chapterNum}장 — ${factorKo}`;
  const tipParts = parseTipText(facts.llmText?.[`${chKey}/양육 Tip`]);
  const whyText = cachedBlock?.whyIntro
    ? `<p>${cachedBlock.whyIntro}</p>`
    : llm(facts, `${chKey}/왜 이런 결인가`, `${factorKo} 본문 산문 250~300자`);

  return `
    <div class="page">
      <div class="page-num">Page ${pageNum}</div>
      <div class="chapter-header ${c.chapter}">${chapterNum}장 — ${factorKo}</div>
      ${renderSingleScoreBar(f)}
      <div class="score-box">
        ${facts.child.fullTitle}의 ${factorKo}${josa(factorKo, '은', '는')} ${levelKo}으로 드러나는 결입니다.<br/>
        <strong>${shortText}</strong>입니다.
      </div>
      <h3>왜 이런 결인가</h3>
      ${whyText}
      ${renderFactorEvidenceTable(facts, factorKey)}
      ${cachedBlock ? '' : renderFactorMechanism(facts, factorKey)}
      ${cachedBlock ? '' : renderFactorRichInterpretation(facts, factorKey)}
      ${renderCachedDailyScene(facts, factorKey, cachedBlock)}
      <div class="tip-box">
        <div class="tip-label">👨‍👩‍👧 양육 Tip — ${factorKo}${josa(factorKo, '이', '가')} ${levelKo}인 결의 자녀에게</div>
        ${renderCachedTipItem(cachedBlock?.parentingTipTime, tipParts, 0, '시간 리듬을 맞춰 주십시오', '시간 축 80~120자')}
        ${renderCachedTipItem(cachedBlock?.parentingTipCommunication, tipParts, 1, '소통 방식을 맞춰 주십시오', '소통 축 80~120자')}
        ${renderCachedTipItem(cachedBlock?.parentingTipEnvironment, tipParts, 2, '환경을 맞춰 주십시오', '환경 축 80~120자')}
      </div>
    </div>
  `;
}

export function renderPage4to9Factors(facts) {
  const order = ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi'];
  return order.map((k, i) => renderFactorChapter(facts, k, 4 + i, 2 + i)).join('\n');
}

// p.10 동물 유형 자세히 살펴보기
const ANIMAL_DETAIL = {
  tiger: {
    summary: '움직이는 기운 + 먼저 해보는 결 + 에너지가 모이는 자리',
    strengths: [
      '몸으로 먼저 익히고, 새로운 놀이에 빠르게 뛰어드는 힘이 있습니다.',
      '분위기를 깨우는 활기가 있어 또래 사이에서 시작점이 되는 경우가 많습니다.',
      '생각보다 행동이 먼저 나올 수 있지만, 그만큼 경험으로 배우는 속도도 빠릅니다.',
      '작은 성공을 몸으로 확인하면 자신감이 크게 살아나는 유형입니다.',
    ],
    cautions: [
      '멈춰야 하는 순간에 갑자기 제동을 걸면 더 크게 튈 수 있습니다.',
      '에너지가 남아 있으면 말보다 몸짓이나 장난으로 표현될 수 있습니다.',
      '위험한 행동을 혼내기 전에 안전한 움직임의 통로를 먼저 만들어주는 편이 좋습니다.',
    ],
    tips: [
      ['시간', '먼저 충분히 움직이고 난 뒤에 씻기, 식사, 잠자리처럼 차분한 루틴으로 넘어가게 해주세요. 활동 시간을 없애기보다 하루 안에 예측 가능한 움직임 시간을 넣어두면 에너지가 안정적으로 풀립니다.'],
      ['소통', '"그만해"보다 "여기까지 뛰고, 그다음 물 마시자"처럼 끝 지점을 보여주는 말이 잘 맞습니다. 행동을 막는 말만 반복하기보다 다음 행동을 짧고 분명하게 알려주세요.'],
      ['환경', '뛰어도 되는 자리와 쉬는 자리를 분리해 주세요. 안전한 바닥, 치울 수 있는 동선, 부딪히지 않는 놀이 구역이 있으면 활기가 장점으로 살아납니다.'],
    ],
  },
  rabbit: {
    summary: '신중한 기운 + 안전을 살피는 결 + 천천히 여는 자리',
    strengths: [
      '새로운 상황을 먼저 살피고, 위험한 지점을 빠르게 알아차리는 감각이 있습니다.',
      '낯선 사람이나 장소 앞에서 조심스럽지만 익숙해지면 섬세하게 반응합니다.',
      '작은 변화도 잘 느끼기 때문에 안정된 환경에서는 관찰력과 배려가 살아납니다.',
      '자기 속도만 인정받으면 오래 보고 깊게 익히는 힘이 커집니다.',
    ],
    cautions: [
      '수줍음을 문제로 단정하면 더 움츠러들 수 있습니다.',
      '갑작스러운 이동, 큰 소리, 낯선 요구에는 시간이 더 필요합니다.',
      '안전 신호 없이 바로 참여를 요구하면 거부처럼 보일 수 있습니다.',
    ],
    tips: [
      ['시간', '새로운 일정 전에는 미리 말해주고, 도착 후에도 주변을 보는 시간을 짧게 보장해 주세요. 준비 시간이 있으면 토끼의 조심성은 불안이 아니라 안정감으로 바뀝니다.'],
      ['소통', '"괜찮아, 천천히 봐도 돼"처럼 아이의 속도를 인정하는 말이 좋습니다. 용기를 칭찬할 때도 크게 밀어붙이기보다 한 걸음 움직인 사실을 구체적으로 짚어주세요.'],
      ['환경', '처음부터 큰 무리보다 익숙한 사람, 조용한 공간, 예측 가능한 순서가 잘 맞습니다. 안전하다고 느끼는 작은 자리가 생기면 관계도 천천히 열립니다.'],
    ],
  },
  horse: {
    summary: '밝게 표현하는 기운 + 즐거움을 찾는 결 + 따뜻함이 모이는 자리',
    strengths: [
      '일상에서 즐거운 장면을 잘 찾고 표정이나 말로 밝게 드러내는 힘이 있습니다.',
      '칭찬과 반응을 받으면 더 생생하게 표현하고 관계 안에서 활기가 살아납니다.',
      '작은 놀이, 노래, 웃음처럼 긍정 정서를 나누는 장면에 강합니다.',
      '분위기를 부드럽게 만들고 주변 사람을 웃게 하는 힘이 있습니다.',
    ],
    cautions: [
      '기분이 좋아진 뒤에는 전환 시간이 필요할 수 있습니다.',
      '반응을 얻고 싶어 장난이 길어지거나 말이 많아질 수 있습니다.',
      '좋아하는 마음을 바로 멈추게 하면 실망이 크게 느껴질 수 있습니다.',
    ],
    tips: [
      ['시간', '즐거운 활동 뒤에는 정리 노래, 물 마시기, 조용한 놀이처럼 부드러운 마무리 시간을 붙여주세요. 갑자기 끊는 것보다 끝나는 신호를 반복하는 편이 안정적입니다.'],
      ['소통', '"재밌었구나", "좋아서 더 하고 싶었구나"처럼 감정 이름을 먼저 붙여주세요. 그다음 "한 번 더 하고 끝"처럼 경계를 말하면 받아들이기 쉽습니다.'],
      ['환경', '웃고 표현할 수 있는 놀이와 차분히 내려오는 놀이가 함께 있으면 좋습니다. 밝은 자극만 계속 주기보다 쉬는 리듬을 같이 만들어주세요.'],
    ],
  },
  pig: {
    summary: '깊이 느끼는 기운 + 감정을 오래 머금는 결 + 회복이 필요한 자리',
    strengths: [
      '마음의 변화가 섬세하고, 자신이 느낀 감정을 깊게 간직하는 힘이 있습니다.',
      '조용히 받아들인 뒤 나중에 자기 방식으로 표현하는 경우가 많습니다.',
      '타인의 기분도 잘 느껴 따뜻하게 반응하는 감수성이 있습니다.',
      '충분히 회복되면 정서 표현이 풍부하고 깊어집니다.',
    ],
    cautions: [
      '감정이 바로 풀리지 않아도 일부러 고집을 부리는 것은 아닐 수 있습니다.',
      '큰 행사나 낯선 만남 뒤에는 혼자 가라앉는 시간이 필요합니다.',
      '감정을 설명하기 전에 먼저 받아주는 말이 필요합니다.',
    ],
    tips: [
      ['시간', '자극이 많았던 날에는 조용히 쉬는 시간을 일정 안에 넣어주세요. 감정 회복 시간이 있어야 다음 행동으로 자연스럽게 넘어갑니다.'],
      ['소통', '"속상했구나", "놀랐구나"처럼 감정을 먼저 받아주세요. 해결책을 빨리 주기보다 아이가 마음을 정리할 수 있게 짧고 부드럽게 기다려주는 편이 좋습니다.'],
      ['환경', '밝고 복잡한 자극이 계속되는 공간보다 조용한 구석, 익숙한 물건, 편안한 조명이 도움이 됩니다. 마음을 내려놓을 수 있는 자리가 필요합니다.'],
    ],
  },
  sheep: {
    summary: '받쳐주는 기운 + 깊이 느끼는 결 + 신중한 결이 모이는 자리',
    strengths: [
      '사람의 표정과 분위기를 잘 읽고, 관계 안에서 자기 위치를 섬세하게 잡습니다.',
      '친한 사람에게 다정하고, 함께하는 흐름 속에서 안정감을 느낍니다.',
      '상대의 마음을 살피는 힘이 있어 배려가 자연스럽게 드러납니다.',
      '작은 무리 안에서 깊게 친해질 때 결이 가장 편안하게 열립니다.',
    ],
    cautions: [
      '주변 분위기에 영향을 많이 받아 자기 마음을 뒤로 미룰 수 있습니다.',
      '친구 감정과 자기 감정을 구분하는 연습이 필요합니다.',
      '큰 무리에서는 피곤해지거나 눈치를 많이 볼 수 있습니다.',
    ],
    tips: [
      ['시간', '사람과 함께한 뒤에는 혼자 정리하는 시간을 짧게라도 주세요. 관계 안에서 받은 감정을 비우는 시간이 있어야 다시 편안해집니다.'],
      ['소통', '"친구 마음은 그랬고, 너는 어땠어?"처럼 자기 감정과 상대 감정을 나눠 짚어주세요. 공감이 많은 아이일수록 자기 마음을 말하는 연습이 중요합니다.'],
      ['환경', '큰 무리보다 익숙한 친구 1~2명, 안정된 선생님, 예측 가능한 약속이 잘 맞습니다. 안전한 관계 안에서 어울림의 장점이 살아납니다.'],
    ],
  },
  cow: {
    summary: '꾸준히 이어가는 기운 + 끝까지 해내는 결 + 집중이 모이는 자리',
    strengths: [
      '한 번 시작한 것을 오래 붙잡고, 반복 속에서 실력이 쌓이는 유형입니다.',
      '자기 방식이 생기면 안정적으로 해내는 힘이 큽니다.',
      '속도는 빠르지 않아도 과정에 머무르는 힘이 있어 깊게 익힙니다.',
      '작은 과제를 끝까지 마쳤을 때 자신감이 단단해집니다.',
    ],
    cautions: [
      '갑자기 중단시키면 흐름이 깨져 짜증이나 거부로 보일 수 있습니다.',
      '선택지가 너무 많으면 집중이 흩어질 수 있습니다.',
      '결과만 재촉하면 과정에서 쌓이는 장점이 줄어듭니다.',
    ],
    tips: [
      ['시간', '시작과 끝이 보이는 작은 과제로 나눠주세요. "여기까지 하고 쉬자"처럼 끝 지점을 분명히 하면 끈기가 안정적으로 살아납니다.'],
      ['소통', '결과보다 "오래 보고 있었네", "다시 해봤구나"처럼 과정을 인정해 주세요. 꾸준함을 알아주는 말이 아이의 내부 동기를 키웁니다.'],
      ['환경', '자주 쓰는 자리, 정해진 도구, 정리된 선택지가 잘 맞습니다. 산만한 자극을 줄이고 익숙한 루틴을 만들면 집중이 깊어집니다.'],
    ],
  },
  dragon: {
    summary: '여섯 결이 두루 모인 기운 + 균형 잡힌 흐름 + 고르게 열리는 자리',
    strengths: [
      '한 가지 결만 튀기보다 상황에 따라 여러 면이 고르게 드러납니다.',
      '움직임, 신중함, 표현, 감정, 관계, 끈기가 균형 있게 섞여 있습니다.',
      '환경이 바뀌어도 비교적 적응 폭이 넓고 다양한 놀이를 받아들입니다.',
      '부모가 한쪽으로 단정하지 않을수록 여러 장점이 자연스럽게 살아납니다.',
    ],
    cautions: [
      '겉으로 무난해 보여도 그날의 피로와 감정은 따로 살펴야 합니다.',
      '특정 장점 하나만 계속 요구하면 균형이 흔들릴 수 있습니다.',
      '상황마다 다른 모습을 보이는 것을 일관성 없음으로만 보지 않는 편이 좋습니다.',
    ],
    tips: [
      ['시간', '활동, 휴식, 관계, 혼자 놀이가 하루 안에서 고르게 지나가게 해주세요. 균형형 아이는 한쪽 자극이 과하면 오히려 장점이 흐려질 수 있습니다.'],
      ['소통', '"오늘은 어떤 게 제일 좋았어?"처럼 그날의 결을 묻는 말이 잘 맞습니다. 아이를 한 유형으로만 부르기보다 상황별 반응을 함께 관찰해 주세요.'],
      ['환경', '여러 선택지를 모두 펼치기보다 2~3가지 안에서 고르게 경험하게 해주세요. 안정된 기본 루틴 안에 작은 변화를 넣으면 균형감이 살아납니다.'],
    ],
  },
};

function animalDetail(animal) {
  return ANIMAL_DETAIL[animal.type] ?? ANIMAL_DETAIL.dragon;
}

function renderAnimalBullets(items) {
  return items.map(item => `<li>${item}</li>`).join('');
}

function renderAnimalTips(items) {
  const icons = { '시간': '⏱', '소통': '💬', '환경': '🌿' };
  const titles = {
    '시간': '시간 — 아이의 결에 맞는 회복 루틴 만들기',
    '소통': '소통 — 감정과 행동을 구분해 짚어주기',
    '환경': '환경 — 편안하게 자기 결이 살아나는 자리 만들기',
  };
  const extra = {
    '시간': '짧아도 매일 비슷한 시간에 반복되면 아이는 그 흐름을 안전 신호로 받아들입니다.',
    '소통': '말을 길게 설명하기보다 아이가 느낀 마음을 먼저 짚고, 그다음 해야 할 행동을 한 문장으로 알려주는 방식이 좋습니다.',
    '환경': '공간이 안정되면 아이는 불필요한 긴장을 덜고 자기 장점을 더 자연스럽게 드러낼 수 있습니다.',
  };
  return items.map(([title, body]) => `
    <div class="tip-item">
      <div class="tip-title">${icons[title] ?? '•'} ${titles[title] ?? title}</div>
      <div class="tip-desc">${body} ${extra[title] ?? ''}</div>
    </div>
  `).join('');
}

export function renderPage10Animal(facts) {
  const a = facts.animal;
  const detail = animalDetail(a);
  const top3HTML = a.top3.map(t => {
    const c = FACTOR_COLORS[t.key];
    return `
      <div class="bar-row">
        <div class="bar-name">${t.factorKorean}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${t.score}%;background:${c.main}"></div></div>
        <div class="bar-score">${t.score}</div>
        <div class="bar-label level-high">${t.label}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="page">
      <div class="page-num">Page 10</div>
      <div class="chapter-header ch-eoullim">8장 — ${a.emoji} ${a.name}의 결 자세히 살펴보기</div>

      <div style="margin: 16px 0;">
        <div style="background: ${a.color}; color: ${a.textColor}; padding: 9px 14px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 700;">
          ${a.emoji} 동물 유형 해석이란?
        </div>
        <div style="background: ${a.color}33; padding: 14px 16px; border-radius: 0 0 8px 8px; font-size: 13px; line-height: 1.85; color: #555; border: 1px solid ${a.color}; border-top: none;">
          <p style="margin-bottom: 12px;">보고서 앞 6장에서 살펴본 <strong>여섯 가지 결</strong>(활기·조심·만족·흔들림·어울림·끈기) 중, ${facts.child.fullTitle}의 사주에서 <strong>가장 두드러진 결</strong>을 본 유형으로 정해드렸어요.</p>
          <p style="margin-bottom: 12px;">사주에서 <strong>가장 깊게 자리한 결</strong>은 그 아이의 본질이 되는 흐름이고, 일상 행동과 부모님과의 관계에 가장 큰 영향을 줍니다.</p>
          <p>${a.caseTone.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>
        </div>
      </div>

      <h3 style="margin-top:22px;">결 위치로 보면</h3>
      ${top3HTML}

      <div style="text-align:center;margin:24px 0 20px;background:linear-gradient(135deg,${a.color} 0%,#fff5f7 100%);padding:18px 16px;border-radius:14px;border:1px solid ${a.color};">
        <div style="font-size:54px;line-height:1;margin-bottom:6px;">${a.emoji}</div>
        <div style="font-size:15px;font-weight:700;color:${a.textColor};">${facts.child.fullTitle}은 ${a.name}의 결</div>
        <div style="font-size:12px;color:#666;margin-top:6px;line-height:1.6;">${detail.summary}</div>
      </div>

      <div class="strength-box">
        <div class="title">🌸 ${a.name} 유형 아이는…</div>
        <ul>${renderAnimalBullets(detail.strengths)}</ul>
      </div>

      <div class="care-box">
        <div class="title">🌿 이런 점은 유의해 주세요</div>
        <ul>${renderAnimalBullets(detail.cautions)}</ul>
      </div>

      <div class="tip-box">
        <div class="tip-label">👨‍👩‍👧 ${a.name}의 결 자녀를 위한 양육 Tip</div>
        ${renderAnimalTips(detail.tips)}
      </div>

      <p style="text-align:center;font-size:11px;color:#888;margin-top:20px;line-height:1.7;">
        이제 다음 페이지부터는<br/>${facts.meta.hasMother && facts.meta.hasFather ? '어머님·아버님' : facts.meta.hasMother ? '어머님' : '아버님'} 사주와 만나는 자리를 살펴봅니다.
      </p>
    </div>
  `;
}

// p.11 전환·환기
export function renderPage11Transition(facts) {
  return `
    <div class="page transition-page">
      <div class="page-num">Page 11</div>
      <div class="transition-content">
        <div class="transition-icon">🌿</div>
        <h2 class="transition-title">
          자녀의 결을 알았다면,<br/>이제 만남의 결을 봅니다
        </h2>
        <div class="transition-divider"></div>
        <p class="transition-body">자녀의 결은<br/>혼자 자라지 않습니다.</p>
        <p class="transition-body">${facts.meta.hasMother ? '어머님의 결과 만나는 자리' : ''}${facts.meta.hasMother && facts.meta.hasFather ? ',<br/>' : ''}${facts.meta.hasFather ? '아버님의 결과 만나는 자리.' : ''}</p>
        <p class="transition-body emphasis">그 만남이<br/>자녀가 자라는 환경을 만듭니다.</p>
      </div>
    </div>
  `;
}

// p.12 미리보기
export function renderPage12Preview(facts) {
  const items = [];
  if (facts.meta.hasMother) items.push({ n: '9장', title: '어머님 사주의 결', desc: '어머님 사주에 자리한 6가지 기운' });
  if (facts.meta.hasFather) items.push({ n: '10장', title: '아버님 사주의 결', desc: '아버님 사주에 자리한 6가지 기운' });
  items.push({ n: '11장', title: '부모-자녀 사주 궁합', desc: '세 분의 일간이 만나는 자리' });
  items.push({ n: '12장', title: '함께 살펴줄 결', desc: '결과 결이 만날 때 가장 단단한 자리와 함께 살펴줄 자리' });

  return `
    <div class="page">
      <div class="page-num">Page 12</div>
      <h3 style="text-align:center; margin-bottom: 20px; color: #c84d20;">다음 장에서 함께 보실 ${items.length}가지</h3>
      <div class="preview-list">
        ${items.map(it => `
          <div class="preview-item">
            <div class="preview-num">${it.n}</div>
            <div class="preview-content">
              <div class="preview-title">${it.title}</div>
              <div class="preview-desc">${it.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="value-message">
        <div class="value-mark">✨</div>
        <p>부모님 사주를 알고<br/>자녀와의 결합을 미리 보시면,</p>
        <p>잘 맞는 자리는 더 살리고<br/>부딪히는 자리는 미리 살필 수 있습니다.</p>
        <p class="value-final">양육이 더 자연스러워지는 결.</p>
      </div>
    </div>
  `;
}

// p.13·14 부모 사주 페이지 공통
function renderParentSajuPage(facts, role, pageNum) {
  const parent = facts[role];
  if (!parent) return '';
  const axes = role === 'mother' ? facts.motherAxes : facts.fatherAxes;
  const cards = role === 'mother' ? facts.parentFactorCards.mother : facts.parentFactorCards.father;
  const label = parent.label;
  const johu = role === 'mother' ? facts.parentFactorCards.mother.find(c => c.key === 'special-johu') : null;

  // 가장 강한 기운 추출
  const topFactors = cards
    .filter(c => c.strength >= 50 && c.key !== 'special-johu')
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map(c => c.label)
    .join(' · ');
  const parentTextBlock = getParentSajuTextBlock({ facts, role, parentMainTrait: topFactors });

  const johuCard = cards.find(c => c.key === 'special-johu');
  const johuText = johuCard ? johuCard.strengthLabel : '균형';

  return `
    <div class="page">
      <div class="page-num">Page ${pageNum}</div>
      <div class="chapter-header ch-parent">${role === 'mother' ? '9장' : '10장'} — ${label} 사주의 결</div>
      ${renderSaju8Box(
        `${parent.name} ${label} 사주`,
        parent.pillars,
        formatSajuInfo(parent, topFactors, johuText)
      )}
      <div style="margin-top:14px;">
        ${parentTextBlock
          ? `<p>${parentTextBlock.parentSajuBody}</p>`
          : llm(facts, `${role === 'mother' ? '9장' : '10장'} — ${label} 사주의 결`, `${label} 일간 비유 + 사주 큰 흐름 200~250자`)}
      </div>
      <h3>${label} 사주에 자리한 6가지 기운</h3>
      <p style="font-size:11px;color:#888;margin-bottom:8px;">탭하면 작용 디테일이 펼쳐집니다</p>
      ${renderFactorCards(cards)}
      <p style="margin-top:24px;">${parentTextBlock?.parentSajuBridge ?? `${label} 사주의 큰 흐름은 ${topFactors}이 본기로 자리해 단단한 결을 이룹니다.`}</p>
    </div>
  `;
}

function renderParentSajuRichText(facts, role, topFactors, johuText) {
  const parent = facts[role];
  if (!parent) return '';
  const label = role === 'mother' ? '어머님' : '아버님';
  const child = facts.child.fullTitle;
  const ilgan = stemDetailWordRich(parent.ilgan, parent.ilganBiyu ?? '');
  const roleTone = role === 'mother'
    ? '아이를 안쪽에서 받쳐주고 정서의 온도를 조절하는 자리'
    : '아이에게 생활의 기준과 방향을 보여주는 자리';
  const relation = facts.ilganRelations?.[role];
  const flow = relation ? relationFlowWord(relation) : '서로 만나는 흐름';

  return `
    <div style="background:#fffaf4;border:1px solid #f0d9c4;border-radius:10px;padding:14px 16px;margin:14px 0;font-size:13px;line-height:1.9;color:#4d4037;">
      <p>${label}의 일간은 <strong>${ilgan}</strong>으로 풀어볼 수 있습니다. 사주 안에서는 ${topFactors || '여러 기운'}이 비교적 중심에 놓이고, 조후는 <strong>${johuText}</strong> 쪽으로 정리됩니다.</p>
      <p>이 말은 ${label}의 성격을 한 문장으로 단정하는 뜻이 아니라, ${child}이 부모님을 만날 때 어떤 분위기와 리듬을 먼저 느끼는지를 보는 기준입니다. ${label}은 ${roleTone}로 작용하기 쉽고, 자녀의 결과 만날 때는 <strong>${flow}</strong>으로 이어집니다.</p>
      <p>그래서 이 장에서는 ${label} 개인의 사주만 따로 보는 것이 아니라, 아래의 여섯 기운이 ${child}의 여섯 결과 만날 때 어디가 편하고 어디를 조심해야 하는지까지 함께 살피는 준비 단계로 보면 됩니다.</p>
    </div>
  `;
}

export function renderPage13Mother(facts) {
  return renderParentSajuPage(facts, 'mother', 13);
}

export function renderPage14Father(facts) {
  return renderParentSajuPage(facts, 'father', 14);
}

const ROLE_WORD = {
  mother: '어머님',
  father: '아버님',
};

function relationFlowWord(rel) {
  const tong = rel?.sipseongTong ?? '서로 만나는 흐름';
  const mapped = {
    인성: '받쳐주는 흐름',
    재성: '결과를 만드는 흐름',
    관성: '기준을 주는 흐름',
    비겁: '함께 닮은 흐름',
    식상: '표현을 열어주는 흐름',
  }[tong];
  return (mapped ?? tong).replace(/기운/g, '흐름');
}

const STEM_NATURE_WORD = {
  갑: '큰 나무', 을: '작은 나무', 병: '큰 불', 정: '작은 불', 무: '큰 흙',
  기: '작은 흙', 경: '큰 쇠', 신: '작은 쇠', 임: '큰 물', 계: '작은 물',
};

function renderIlganRelationText(facts, role) {
  const rel = facts.ilganRelations[role];
  const parent = facts[role];
  if (!rel || !parent) return '';
  const roleWord = ROLE_WORD[role];
  const child = facts.child.fullTitle;
  const flow = relationFlowWord(rel);
  const parentBiyu = STEM_NATURE_WORD[rel.parentIlgan] ?? (rel.parentBiyu ?? parent.ilganBiyu ?? '').replace(/[()]/g, '');
  const childBiyu = STEM_NATURE_WORD[rel.childIlgan] ?? (rel.childBiyu ?? facts.child.ilganBiyu ?? '').replace(/[()]/g, '');
  const daily = role === 'mother'
    ? `${child}이 ${roleWord} 옆에서 가장 편안해지고, ${roleWord}의 말투와 손길 안에서 자기 결을 자연스럽게 드러내는 장면이 자주 보입니다.`
    : `${child}이 ${roleWord}과 함께 있을 때 자기 결의 단단함을 키워가며, 기준과 방향을 배워가는 장면이 자주 보입니다.`;

  return `
    <h3>${roleWord} — ${child}</h3>
    <div class="llm-content" style="font-size:13px;line-height:1.9;">
      <p>${roleWord}은 ${parentBiyu}, ${child}은 ${childBiyu}입니다. 두 결은 사주 안에서 <strong>${flow}</strong>으로 만나며, ${roleWord}의 결이 ${child}에게 자연스럽게 닿는 관계입니다.</p>
      <p>명리에서는 이 결합을 "${roleWord}이 자녀에게 ${flow}으로 자리하는 흐름"으로 풀이합니다. ${roleWord}이 곁에 있을 때 ${child}의 결이 더 안정되거나, 방향을 얻거나, 자기 속도를 찾는 식으로 나타납니다.</p>
      <div style="margin-top:12px;padding:12px 14px;background:#fdf4e8;border-left:4px solid #c4a578;border-radius:8px;"><strong>일상에서는</strong> ${daily}</div>
    </div>
  `;
}

function renderParentSipseongText(facts) {
  const ps = facts.ilganRelations.parentSipseongInChildSaju;
  const child = facts.child.fullTitle;
  const motherFlow = ps?.어머니궁?.tongMyeong ?? '받쳐주는 기운';
  const fatherFlow = ps?.아버지궁?.tongMyeong ?? '절제하는 기운';
  return `
    <h3>일지 관계 · 자녀 사주에서 본 부모 십성</h3>
    <div class="llm-content" style="font-size:13px;line-height:1.9;">
      <p>${child}의 사주에서 어머님은 <strong>${motherFlow}</strong>으로, 아버님은 <strong>${fatherFlow}</strong>으로 나타납니다.</p>
      <p>이것은 부모님의 실제 성격을 단정하는 말이 아니라, ${child}의 사주 안에서 부모 자리가 어떤 흐름으로 느껴지는지를 보는 차원입니다. ${motherFlow}과 ${fatherFlow}이 함께 자리하면 아이에게 안정과 기준이 같이 놓인 양육 환경이 됩니다.</p>
    </div>
  `;
}

// p.15 부모-자녀 사주 궁합
export function renderPage15Gunghap(facts) {
  return `
    <div class="page">
      <div class="page-num">Page 15</div>
      <div class="chapter-header ch-parent">11장 — 부모-자녀 사주 궁합</div>
      ${renderTriangleSVG(facts)}

      ${facts.ilganRelations.mother ? `
        <h3>어머님 — ${facts.child.fullTitle}</h3>
        ${llm(facts, `11장 — 부모-자녀 사주 궁합/어머님 — ${facts.child.fullTitle}`, '어머님-자녀 단락 본문 4단')}
      ` : ''}

      ${facts.ilganRelations.father ? `
        <h3>아버님 — ${facts.child.fullTitle}</h3>
        ${llm(facts, `11장 — 부모-자녀 사주 궁합/아버님 — ${facts.child.fullTitle}`, '아버님-자녀 단락 본문 4단')}
      ` : ''}

      <h3>자녀 사주에서 본 부모 십성</h3>
      <p>${facts.child.fullTitle}의 사주에서 ${facts.meta.hasMother ? `어머님은 <strong>${facts.ilganRelations.parentSipseongInChildSaju.어머니궁.tongMyeong}</strong>` : ''}${facts.meta.hasMother && facts.meta.hasFather ? '으로, ' : ''}${facts.meta.hasFather ? `아버님은 <strong>${facts.ilganRelations.parentSipseongInChildSaju.아버지궁.tongMyeong}</strong>` : ''}으로 나타납니다.</p>
      <p style="font-size:12px;color:#666;">자녀 사주의 부모 자리(궁) 자체에 어떤 기운이 자리하는지 — 차원 B 분석. 부모의 실제 일간 관계와는 다른 차원의 풀이입니다.</p>
    </div>
  `;
}

// p.16 함께 살펴줄 결
export function renderPage16Matrix(facts) {
  const cards = facts.matrixCards;
  return `
    <div class="page">
      <div class="page-num">Page 16</div>
      <div class="chapter-header ch-parent">12장 — 함께 살펴줄 결</div>
      <div class="disclaimer">※ 본 보고서의 사주 풀이는 타고난 결을 분석한 것이며, 실제 행동·양육은 환경·경험·선택에 따라 달라질 수 있습니다.</div>

      ${renderMatrixSummary(facts)}

      ${facts.meta.hasMother && cards.motherCards.length > 0 ? `
        <h3 style="margin-top:20px;color:#8a6332;">어머님과 ${facts.child.fullTitle}의 결합</h3>
        ${cards.motherCards.map(card => renderCachedMatrixCard(facts, 'mother', card)).join('')}
      ` : ''}

      ${facts.meta.hasFather && cards.fatherCards.length > 0 ? `
        <h3 style="margin-top:24px;color:#2d5a8a;">아버님과 ${facts.child.fullTitle}의 결합</h3>
        ${cards.fatherCards.map(card => renderCachedMatrixCard(facts, 'father', card)).join('')}
      ` : ''}
    </div>
  `;
}

// p.17 outro
export function renderPage17Outro(facts) {
  const llmText = facts.llmText?.['자도인의 마지막 당부'];
  let body;
  if (llmText) {
    body = llmText.split(/\n+/).map((p, i, arr) => {
      const isLast = i === arr.length - 1;
      const style = isLast
        ? 'font-size:14px;line-height:1.95;margin-bottom:18px;text-align:center;color:#c84d20;font-weight:600;'
        : 'font-size:14px;line-height:1.95;margin-bottom:18px;';
      return `<p style="${style}">${p}</p>`;
    }).join('');
  } else {
    body = `
      <p style="font-size:14px;line-height:1.95;margin-bottom:18px;">여기까지 ${facts.child.fullTitle}의 결을 함께 들여다봐 주셔서 감사합니다.</p>
      <p style="font-size:14px;line-height:1.95;margin-bottom:18px;">이 보고서의 핵심은 점수로 아이를 단정하는 데 있지 않습니다. ${facts.child.fullTitle}이 어떤 장면에서 자연스럽게 열리고, 어떤 장면에서 조심스럽게 속도를 조절하는지를 부모님의 언어로 이해하는 데 있습니다.</p>
      <p style="font-size:14px;line-height:1.95;margin-bottom:18px;">부모님의 사주 역시 좋고 나쁨의 평가가 아니라, 아이에게 닿는 리듬과 분위기를 살피는 자료입니다. 어머님과 아버님의 결을 알면 아이를 바꾸려 하기보다 아이에게 맞는 기준과 환경을 더 섬세하게 잡아줄 수 있습니다.</p>
      <p style="font-size:14px;line-height:1.95;margin-bottom:18px;">아이의 결과 부모님의 결은 매일의 말투, 기다려주는 시간, 생활의 반복 속에서 만납니다. 작은 장면을 꾸준히 맞춰갈 때 ${facts.child.fullTitle}의 타고난 결은 더 편안하고 단단하게 자라납니다.</p>
      <p style="font-size:14px;text-align:center;color:#c84d20;font-weight:600;">
        ${facts.meta.hasMother && facts.meta.hasFather ? '어머님 · 아버님의' : facts.meta.hasMother ? '어머님의' : '아버님의'} 자리에서, ${facts.child.fullTitle}의 결을 함께 살펴주세요.
      </p>
    `;
  }

  return `
    <div class="page">
      <div class="page-num">Page 17</div>
      <div class="chapter-header ch-outro">자도인의 마지막 당부</div>
      ${body}
      <div class="disclaimer" style="margin-top:36px;">
        ※ 본 풀이는 사주명리학을 현시대 부모의 언어로 재표현한 양육 안내이며, 의학적 진단·치료가 아닙니다.<br/>
        사주는 타고난 결이며 실제 행동·양육은 환경·경험·선택에 따라 달라질 수 있습니다.
      </div>
      <div style="text-align:right;margin-top:32px;color:#aaa;font-size:13px;">— 자도인(慈道人) —</div>
    </div>
  `;
}

// ─── 전체 17p 렌더 ───
export function renderReport(facts) {
  return [
    renderPage1Cover(facts),
    renderPage2Intro(facts),
    renderPage3Overview(facts),
    renderPage4to9Factors(facts),
    renderPage10Animal(facts),
    renderPage11Transition(facts),
    renderPage12Preview(facts),
    renderPage13Mother(facts),
    renderPage14Father(facts),
    renderPage15GunghapRich(facts),
    renderPage16Matrix(facts),
    renderPage17Outro(facts),
  ].join('\n');
}

const STEM_DETAIL_WORD_RICH = {
  갑: '큰 나무·둥치(갑목)',
  을: '작은 나무(을목)',
  병: '큰 불·햇빛(병화)',
  정: '작은 불(정화)',
  무: '큰 흙·산(무토)',
  기: '작은 흙·들판(기토)',
  경: '큰 쇠·도끼(경금)',
  신: '작은 쇠·바늘(신금)',
  임: '큰 물·강(임수)',
  계: '작은 물·이슬(계수)',
};

const BRANCH_DETAIL_WORD_RICH = {
  자: '자수(子)',
  축: '축토(丑)',
  인: '인목(寅)',
  묘: '묘목(卯)',
  진: '진토(辰)',
  사: '사화(巳)',
  오: '오화(午)',
  미: '미토(未)',
  신: '신금(申)',
  유: '유금(酉)',
  술: '술토(戌)',
  해: '해수(亥)',
};

function stemDetailWordRich(stem, fallback = '') {
  return STEM_DETAIL_WORD_RICH[stem] ?? fallback.replace(/[()]/g, '') ?? stem ?? '';
}

function relationDailyRich(roleWord, child, rel) {
  if (rel.type === 'parentControlsChild') {
    return `${child}은 ${roleWord} 앞에서 자기 행동의 기준을 더 또렷하게 느낍니다. 말 한마디나 표정 하나에도 "어디까지 해도 되는지"를 살피기 쉬운 관계라, 기준이 부드럽게 제시될 때 안정감이 커집니다.`;
  }
  if (rel.type === 'childGivesParent') {
    return `${child}이 ${roleWord}에게 활력과 의미를 되돌려주는 장면이 자주 생깁니다. ${roleWord}은 아이를 돌보는 과정에서 자기 결을 더 쓰게 되고, 아이는 그 반응을 보며 존재감을 확인합니다.`;
  }
  if (rel.type === 'hap') {
    return `${child}과 ${roleWord}은 서로에게 끌리는 결이 있어, 같이 있을 때 말보다 분위기로 먼저 이어지는 장면이 생깁니다. 작은 습관이나 감정의 리듬이 닮아가며 관계의 밀도가 깊어집니다.`;
  }
  if (rel.type === 'donggi') {
    return `${child}과 ${roleWord}은 비슷한 결을 공유해 서로의 속도를 비교적 빨리 알아차립니다. 같은 방향으로 움직일 때는 편하지만, 둘 다 고집이 올라오면 잠깐 거리를 두는 시간이 도움이 됩니다.`;
  }
  return `${child}이 ${roleWord} 옆에서 자기 결을 자연스럽게 드러내는 장면이 자주 보입니다. 익숙한 말투와 반복되는 루틴 안에서 아이의 표정과 행동이 더 안정됩니다.`;
}

function relationAfterRich(roleWord, child, rel) {
  const childStem = stemDetailWordRich(rel.childIlgan, rel.childBiyu ?? rel.childIlgan);
  const parentStem = stemDetailWordRich(rel.parentIlgan, rel.parentBiyu ?? rel.parentIlgan);

  if (rel.type === 'hap') {
    const hapName = rel.hapName ?? '천간합';
    return `특히 ${child}의 일간 ${childStem}와 ${roleWord}의 일간 ${parentStem}은 명리에서 ${hapName}${josa(hapName, '을', '를')} 이루는 관계입니다. 두 사람의 결이 합해서 새로운 흐름을 함께 만들어가는 구조라, 한쪽이 일방적으로 이끄는 관계라기보다 서로의 분위기를 섞어 관계의 결을 깊게 만드는 쪽에 가깝습니다.`;
  }
  if (rel.type === 'childGivesParent') {
    return `특히 ${child}의 일간 ${childStem}와 ${roleWord}의 일간 ${parentStem}은 명리에서 아이의 결이 부모님의 결을 살려주는 흐름으로 이어집니다. ${child}이 ${roleWord}에게 활력과 의미를 되돌려주는 관계라, 아이의 존재 자체가 ${roleWord}의 결을 움직이게 만들고 "이 아이를 위해 더 잘 살아야겠다"는 마음을 자연스럽게 일으키는 사주 결합입니다.`;
  }
  if (rel.type === 'parentControlsChild') {
    return `특히 ${child}의 일간 ${childStem}와 ${roleWord}의 일간 ${parentStem}은 명리에서 기준과 절제를 배우는 관계입니다. ${roleWord}의 결은 ${child}에게 방향을 잡아주는 힘이 되지만, 너무 강하게 전달되면 아이가 먼저 위축될 수 있습니다. 부드러운 톤으로 한 가지씩 짚어줄 때 ${child}의 결이 가장 자연스럽게 자라는 사주 결합입니다.`;
  }
  if (rel.type === 'parentGivesChild') {
    return `특히 ${child}의 일간 ${childStem}와 ${roleWord}의 일간 ${parentStem}은 명리에서 받침을 이루는 관계입니다. ${roleWord}의 결이 ${child}을 안쪽에서 받쳐주고, 아이는 그 안정감 위에서 자기 속도를 찾습니다. 곁에 있을 때 마음이 먼저 놓이고, 그 뒤에 행동과 표현이 자연스럽게 열리는 사주 결합입니다.`;
  }
  if (rel.type === 'childControlsParent') {
    return `특히 ${child}의 일간 ${childStem}와 ${roleWord}의 일간 ${parentStem}은 명리에서 결과를 만들어가는 관계입니다. 두 사람의 결이 만나면 ${child}이 ${roleWord}의 반응을 보며 자기 힘을 확인하고, ${roleWord}은 아이가 세상과 부딪히며 자라는 방향을 지켜보게 됩니다. 닮은 점은 편안함이 되고, 다른 점은 아이가 세상을 배우는 작은 기준이 되는 사주 결합입니다.`;
  }
  if (rel.type === 'donggi') {
    return `특히 ${child}의 일간 ${childStem}와 ${roleWord}의 일간 ${parentStem}은 명리에서 같은 결을 비추는 관계입니다. 두 사람은 속도와 반응이 닮아 편안하게 이어지기 쉽지만, 같은 방향의 고집도 함께 올라올 수 있습니다. 그래서 닮은 결은 친밀함으로 살리고, 부딪히는 순간에는 잠깐 간격을 두는 방식이 잘 맞는 사주 결합입니다.`;
  }
  return `${roleWord}과 ${child}은 서로의 결을 비추며 관계를 만들어갑니다. 닮은 점은 편안함이 되고, 다른 점은 아이가 세상을 배우는 작은 기준이 됩니다.`;
}

function renderIlganRelationTextRich(facts, role) {
  const rel = facts.ilganRelations[role];
  const parent = facts[role];
  if (!rel || !parent) return '';
  const roleWord = ROLE_WORD[role];
  const child = facts.child.fullTitle;
  const flow = relationFlowWord(rel);
  const parentBiyu = stemDetailWordRich(rel.parentIlgan, rel.parentBiyu ?? parent.ilganBiyu ?? '');
  const childBiyu = stemDetailWordRich(rel.childIlgan, rel.childBiyu ?? facts.child.ilganBiyu ?? '');
  const cachedBlock = getCompatibilityTextBlock({ facts, role });

  if (cachedBlock) {
    return `
      <h3>${cachedBlock.compatibilityTitle}</h3>
      <div class="llm-content" style="font-size:13px;line-height:1.9;">
        ${cachedBlock.compatibilityBody.map(p => `<p>${p}</p>`).join('')}
        <div style="margin-top:12px;padding:12px 14px;background:#fdf4e8;border-left:4px solid #c4a578;border-radius:8px;"><strong>일상에서는</strong> ${cachedBlock.compatibilityDaily}</div>
      </div>
    `;
  }

  return `
    <h3>${roleWord} — ${child}</h3>
    <div class="llm-content" style="font-size:13px;line-height:1.9;">
      <p>${roleWord}은 ${parentBiyu}, ${child}은 ${childBiyu}입니다. 두 결은 사주 안에서 <strong>${flow}</strong>으로 만나며, ${roleWord}의 결이 ${child}에게 어떤 방식으로 닿는지를 보여줍니다.</p>
      <p>명리에서는 이 결합을 "${roleWord}이 자녀에게 ${flow}으로 자리하는 흐름"으로 풀이합니다. 이것은 성격을 단정하는 말이 아니라, 두 사람이 함께 있을 때 어떤 리듬이 자연스럽게 생기는지를 보는 설명입니다.</p>
      <div style="margin-top:12px;padding:12px 14px;background:#fdf4e8;border-left:4px solid #c4a578;border-radius:8px;"><strong>일상에서는</strong> ${relationDailyRich(roleWord, child, rel)}</div>
      <p>${relationAfterRich(roleWord, child, rel)}</p>
    </div>
  `;
}

function branchFromPillarRich(person) {
  const day = person?.pillars?.day;
  if (day?.branch) return day.branch;
  if (typeof person?.ilju === 'string' && person.ilju.length >= 2) return person.ilju.slice(1, 2);
  return '';
}

function renderParentSipseongTextRich(facts) {
  const ps = facts.ilganRelations.parentSipseongInChildSaju;
  const child = facts.child.fullTitle;
  const motherFlow = ps?.어머니궁?.tongMyeong ?? '받쳐주는 기운';
  const fatherFlow = ps?.아버지궁?.tongMyeong ?? '절제하는 기운';
  const childBranch = branchFromPillarRich(facts.child);
  const motherBranch = branchFromPillarRich(facts.mother);
  const fatherBranch = branchFromPillarRich(facts.father);
  const childBranchText = BRANCH_DETAIL_WORD_RICH[childBranch] ?? childBranch;
  const motherBranchText = BRANCH_DETAIL_WORD_RICH[motherBranch] ?? motherBranch;
  const fatherBranchText = BRANCH_DETAIL_WORD_RICH[fatherBranch] ?? fatherBranch;
  const shared = motherBranch && childBranch && motherBranch === childBranch
    ? `어머님과 ${child}은 마음 자리에 같은 ${childBranchText}를 공유합니다. 같은 일지를 공유한다는 것은 감정의 바탕에서 익숙하게 닿는 결이 있다는 뜻입니다. 말로 길게 설명하지 않아도 서로의 분위기를 먼저 알아차리는 장면이 생기기 쉽습니다.`
    : `어머님의 마음 자리 ${motherBranchText || '일지'}와 ${child}의 마음 자리 ${childBranchText || '일지'}는 서로 다른 결로 놓여 있습니다. 그래서 관계가 늘 같게 흐르기보다, 아이의 속도와 부모님의 반응이 맞춰지면서 안정감을 만들어가는 구조로 볼 수 있습니다.`;
  const fatherLine = fatherBranch
    ? `아버님의 일지 ${fatherBranchText}까지 함께 보면, ${child}에게 부모의 자리는 정서적 받침과 생활의 기준이 동시에 들어오는 자리입니다.`
    : `${child}에게 부모의 자리는 정서적 받침과 생활의 기준이 동시에 들어오는 자리입니다.`;

  return `
    <h3>일지 관계 · 자녀 사주에서 본 부모 십성</h3>
    <div class="llm-content" style="font-size:13px;line-height:1.9;">
      <p>${shared} ${fatherLine}</p>
      <p>${child}의 사주에서 어머님은 <strong>${motherFlow}</strong>으로, 아버님은 <strong>${fatherFlow}</strong>으로 나타납니다. 이것은 부모님의 실제 성격을 단정하는 말이 아니라, 아이의 사주 안에서 부모 자리가 어떤 역할로 느껴지는지를 보는 차원입니다. ${motherFlow}은 아이를 안쪽에서 받쳐주고, ${fatherFlow}은 생활 속 기준과 방향을 잡아주는 흐름으로 함께 작용합니다.</p>
    </div>
  `;
}

export function renderPage15GunghapRich(facts) {
  return `
    <div class="page">
      <div class="page-num">Page 15</div>
      <div class="chapter-header ch-parent">11장 — 부모-자녀 사주 궁합</div>
      ${renderTriangleSVG(facts)}
      ${facts.ilganRelations.mother ? renderIlganRelationTextRich(facts, 'mother') : ''}
      ${facts.ilganRelations.father ? renderIlganRelationTextRich(facts, 'father') : ''}
      ${renderParentSipseongTextRich(facts)}
    </div>
  `;
}

function renderMatrixSummary(facts) {
  const child = facts.child.fullTitle;
  const motherFlow = facts.ilganRelations.parentSipseongInChildSaju?.어머니궁?.tongMyeong ?? '받쳐주는 기운';
  const fatherFlow = facts.ilganRelations.parentSipseongInChildSaju?.아버지궁?.tongMyeong ?? '기준을 주는 기운';
  return `
    <div style="background:linear-gradient(135deg,#fef0e6 0%,#fdfaf6 100%);padding:16px 18px;border-radius:12px;margin:16px 0;border:1px solid #f0d9c4;text-align:center;font-size:13px;line-height:1.8;color:#555;">
      어머님과 아버님의 결은 서로 다른 자산입니다.<br/>
      <strong style="color:#c84d20;">어머님의 ${motherFlow}</strong>과 <strong style="color:#2d5a8a;">아버님의 ${fatherFlow}</strong>이<br/>
      함께 만나 ${child}의 균형 잡힌 양육 환경이 됩니다.
    </div>
  `;
}

function renderCachedMatrixCard(facts, role, card) {
  const block = getMatrixComboTextBlock({ facts, role, card }) ?? getMatrixCardTextBlock({ facts, role, card });
  if (!block) return renderMatrixCardRich(card);

  const isSyn = block.type === 'synergy';
  const cls = isSyn ? 'syn-card' : 'con-card';
  const icon = isSyn ? '✨' : '⚠️';
  const daily = block.daily ?? [];

  return `
    <div class="matrix-card ${cls}">
      <div class="header">${icon} ${block.header}</div>
      <div class="sub">${block.subTemplate}</div>
      <div class="body">
        ${block.body.map(p => `<p style="margin:0 0 12px 0;">${p}</p>`).join('')}
        ${daily.length ? `
          <div style="margin-top:10px;padding:10px 12px;background:rgba(255,143,163,0.1);border-radius:6px;border-left:3px solid #FF8FA3;font-size:12px;color:#666;">
            <strong>🌸 일상에서는…</strong>
            ${daily.map(p => `<p style="margin:6px 0 0 0;">${p}</p>`).join('')}
          </div>
        ` : ''}
        ${block.resolution ? `<div style="margin-top:8px;padding:10px 12px;background:rgba(149,197,64,0.1);border-radius:6px;border-left:3px solid #95C540;font-size:12px;color:#5d8225;"><strong>🌿 이렇게 풀어보세요:</strong> ${block.resolution}</div>` : ''}
      </div>
    </div>
  `;
}
