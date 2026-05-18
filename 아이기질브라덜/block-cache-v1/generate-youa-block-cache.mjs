import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(root, 'cache');
fs.mkdirSync(cacheDir, { recursive: true });

const levels = ['매우낮음', '낮음', '중간', '높음', '매우높음'];
const factorNames = ['활기', '조심', '만족', '흔들림', '어울림', '끈기'];
const roles = [
  { key: 'mother', title: '어머님' },
  { key: 'father', title: '아버님' },
];

const dayMasters = [
  { key: 'gap', ko: '갑목', han: '甲', element: '목', yinYang: '양', metaphor: '큰 나무', plain: '소나무처럼 곧게 자라 방향을 세우는 큰 나무의 기운' },
  { key: 'eul', ko: '을목', han: '乙', element: '목', yinYang: '음', metaphor: '작은 나무', plain: '들풀과 꽃나무처럼 부드럽게 자라나는 작은 나무의 기운' },
  { key: 'byeong', ko: '병화', han: '丙', element: '화', yinYang: '양', metaphor: '큰 불', plain: '한낮의 햇빛처럼 밝게 퍼지고 주변을 환하게 비추는 큰 불의 기운' },
  { key: 'jeong', ko: '정화', han: '丁', element: '화', yinYang: '음', metaphor: '작은 불', plain: '촛불과 등불처럼 안에서 따뜻하게 비추는 작은 불의 기운' },
  { key: 'mu', ko: '무토', han: '戊', element: '토', yinYang: '양', metaphor: '큰 흙', plain: '산과 언덕처럼 넓게 버티고 기준을 세우는 큰 흙의 기운' },
  { key: 'gi', ko: '기토', han: '己', element: '토', yinYang: '음', metaphor: '작은 흙', plain: '밭과 정원처럼 품고 길러내는 작은 흙의 기운' },
  { key: 'gyeong', ko: '경금', han: '庚', element: '금', yinYang: '양', metaphor: '큰 쇠', plain: '도끼와 큰 칼처럼 기준을 세우고 단단하게 정리하는 큰 쇠의 기운' },
  { key: 'sin', ko: '신금', han: '辛', element: '금', yinYang: '음', metaphor: '작은 쇠', plain: '바늘과 보석처럼 정밀하고 섬세하게 다듬는 작은 쇠의 기운' },
  { key: 'im', ko: '임수', han: '壬', element: '수', yinYang: '양', metaphor: '큰 물', plain: '강과 바다처럼 크게 흐르고 멀리 품는 큰 물의 기운' },
  { key: 'gye', ko: '계수', han: '癸', element: '수', yinYang: '음', metaphor: '작은 물', plain: '이슬과 샘물처럼 조용히 스며들어 살리는 작은 물의 기운' },
];

const parentAxes = [
  { key: 'support', label: '받쳐주는 기운', daily: '아이 마음을 먼저 받아주고 안정시키는 흐름' },
  { key: 'expression', label: '표현하는 기운', daily: '아이의 말과 행동을 밖으로 열어주는 흐름' },
  { key: 'standard', label: '절제하는 기운', daily: '생활의 기준과 경계를 세워주는 흐름' },
  { key: 'result', label: '결과를 기대하는 기운', daily: '성취와 결과를 향해 밀어주는 흐름' },
  { key: 'same', label: '같은 결의 기운', daily: '아이의 속도와 감각을 비슷하게 느끼는 흐름' },
  { key: 'stability', label: '일관된 기운', daily: '반복되는 일상과 약속을 지켜주는 흐름' },
];

const sajuInfluenceGroups = [
  {
    key: 'support',
    label: '받쳐주는 기운',
    rawExamples: ['정인', '편인'],
    mechanism: '안에서 받아들이고 마음의 자리를 먼저 만드는 흐름',
    dailyTone: '익숙한 사람과 안정된 환경 안에서 반응이 부드러워집니다',
  },
  {
    key: 'expression',
    label: '표현하는 기운',
    rawExamples: ['식신', '상관'],
    mechanism: '말과 행동, 놀이를 밖으로 풀어내는 흐름',
    dailyTone: '말, 몸짓, 놀이 선택처럼 밖으로 드러나는 반응이 또렷해집니다',
  },
  {
    key: 'standard',
    label: '절제하는 기운',
    rawExamples: ['정관', '편관'],
    mechanism: '규칙과 경계를 세우고 속도를 조절하는 흐름',
    dailyTone: '새 상황 앞에서 먼저 기준을 확인하고 안전한 순서를 찾습니다',
  },
  {
    key: 'result',
    label: '결과를 기대하는 기운',
    rawExamples: ['정재', '편재'],
    mechanism: '눈에 보이는 결과와 성취를 향해 움직이게 하는 흐름',
    dailyTone: '보상, 완성, 약속처럼 결과가 보일 때 반응이 살아납니다',
  },
  {
    key: 'same',
    label: '같은 결의 기운',
    rawExamples: ['비견', '겁재'],
    mechanism: '자기 기준과 자기 속도를 분명히 세우는 흐름',
    dailyTone: '스스로 고른 방식과 자기 페이스가 있을 때 결이 안정됩니다',
  },
  {
    key: 'climate',
    label: '오행·조후의 기운',
    rawExamples: ['목화토금수', '조후', '12운성'],
    mechanism: '사주 전체의 온도와 방향을 조절하는 큰 배경 흐름',
    dailyTone: '컨디션, 계절감, 공간의 자극에 따라 표현 강도가 달라집니다',
  },
];

const childFactorTraits = {
  활기: { trait: '움직임의 결', high: '몸을 움직이며 에너지를 풀어내는 결', low: '차분히 머물며 에너지를 아껴 쓰는 결' },
  조심: { trait: '신중한 결', high: '새 자극 앞에서 안전을 먼저 살피는 결', low: '낯선 자극에도 먼저 다가가 보는 결' },
  만족: { trait: '만족의 결', high: '좋은 감정과 즐거운 반응이 잘 살아나는 결', low: '쉽게 만족하지 않고 기준을 천천히 확인하는 결' },
  흔들림: { trait: '깊이 느끼는 결', high: '감정을 깊게 받고 회복에 시간이 필요한 결', low: '마음의 진폭이 잔잔하고 회복이 빠른 결' },
  어울림: { trait: '관계의 결', high: '사람의 마음과 분위기를 잘 읽는 결', low: '혼자만의 리듬과 개인 시간이 편안한 결' },
  끈기: { trait: '끝까지 붙잡는 결', high: '한 번 시작한 일을 오래 이어가는 결', low: '관심이 자유롭게 옮겨가며 여러 자극을 경험하는 결' },
};

const factorSummaries = {
  활기: {
    매우낮음: '움직임보다 머무름이 훨씬 자연스럽고, 에너지를 안쪽에서 아껴 쓰는 결',
    낮음: '활동성은 은은하고 차분한 놀이와 회복 시간이 더 잘 맞는 결',
    중간: '차분함과 활발함이 함께 있어 상황에 따라 에너지가 달라지는 균형의 결',
    높음: '몸을 움직이며 에너지를 풀어내고 바깥 자극에 생기가 살아나는 결',
    매우높음: '에너지가 매우 풍부해 움직임 속에서 배우고 감정을 풀어내는 결',
  },
  조심: {
    매우낮음: '낯선 자극 앞에서도 망설임이 적고 먼저 다가가 확인하는 결',
    낮음: '도전성이 있고 새 자극에도 비교적 빠르게 다가가는 결',
    중간: '도전과 신중함이 함께 있어 익숙함에 따라 접근 속도가 달라지는 결',
    높음: '새 자극 앞에서 신중하고 안전한 자리부터 찾는 결',
    매우높음: '안전 확인이 매우 중요하고 마음의 준비 시간이 깊게 필요한 결',
  },
  만족: {
    매우낮음: '감각이 까다롭고 쉽게 만족하지 않아 마음에 맞는 조건을 오래 찾는 결',
    낮음: '좋고 싫음의 기준이 분명하고 만족까지 시간이 조금 필요한 결',
    중간: '표현과 절제가 함께 있어 상황에 따라 만족감의 표현이 달라지는 결',
    높음: '일상에서 좋은 결을 자주 발견하고 즐거움을 비교적 쉽게 표현하는 결',
    매우높음: '기쁨과 만족을 크게 느끼고 주변 분위기까지 밝게 끌어올리는 결',
  },
  흔들림: {
    매우낮음: '마음의 진폭이 매우 잔잔하고 감정 회복이 빠른 결',
    낮음: '정서가 비교적 안정적이고 기분 전환이 빠른 결',
    중간: '안정과 민감함이 함께 있어 상황에 따라 감정의 폭이 달라지는 결',
    높음: '감정에 민감하고 한 번 받은 느낌이 마음 안에 오래 머무는 결',
    매우높음: '감정을 매우 깊게 느끼고 회복에도 충분한 시간과 품이 필요한 결',
  },
  어울림: {
    매우낮음: '혼자만의 시간이 매우 중요하고 관계 자극을 오래 받으면 쉽게 지치는 결',
    낮음: '관계보다 자기 리듬이 먼저이고 혼자 노는 시간이 편안한 결',
    중간: '어울림과 혼자됨이 함께 있어 관계와 개인 시간을 오가며 균형을 잡는 결',
    높음: '공감적이고 사교적이며 함께 노는 흐름에서 마음이 살아나는 결',
    매우높음: '관계 감각이 매우 깊고 주변 사람의 마음을 자기 일처럼 받아들이는 결',
  },
  끈기: {
    매우낮음: '관심이 매우 빠르게 이동하고 여러 자극을 가볍게 경험하며 배우는 결',
    낮음: '관심사가 다양하고 한 자리에 오래 묶이기보다 유연하게 옮겨가는 결',
    중간: '인내와 즉흥이 함께 있어 흥미가 맞으면 오래 붙잡고 아니면 유연하게 바꾸는 결',
    높음: '인내심이 있고 한 번 시작한 일을 자기 페이스로 끝까지 들고 가는 결',
    매우높음: '한 번 붙잡은 일을 매우 오래 지속하고 완성까지 가려는 힘이 강한 결',
  },
};

const levelTone = {
  매우낮음: { degree: '매우 은은하게', direction: '반대 결이 더 분명하게' },
  낮음: { degree: '은은하게', direction: '반대 결과 함께' },
  중간: { degree: '균형 있게', direction: '상황에 따라 양쪽 결이' },
  높음: { degree: '분명하게', direction: '해당 결이 일상에서' },
  매우높음: { degree: '매우 깊게', direction: '해당 결이 여러 장면에서 강하게' },
};

function writeJson(name, data) {
  fs.writeFileSync(path.join(cacheDir, name), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function blockKey(parts) {
  return parts.join('|');
}

function relationType(child, parent) {
  if (child.element === parent.element) return { type: 'same', label: '동기 관계', verb: '비슷한 결이 서로를 알아보는 관계' };
  const gives = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
  const controls = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };
  if (gives[parent.element] === child.element) return { type: 'parentGivesChild', label: '부모가 아이를 생하는 관계', verb: '부모의 기운이 아이의 결을 살려주는 관계' };
  if (gives[child.element] === parent.element) return { type: 'childGivesParent', label: '아이가 부모를 생하는 관계', verb: '아이의 존재가 부모의 흐름을 움직이게 하는 관계' };
  if (controls[parent.element] === child.element) return { type: 'parentControlsChild', label: '부모가 아이에게 기준을 주는 관계', verb: '부모의 기준이 아이의 결을 다듬는 관계' };
  if (controls[child.element] === parent.element) return { type: 'childControlsParent', label: '아이가 부모를 자극하는 관계', verb: '아이의 결이 부모의 반응을 새롭게 조정하게 하는 관계' };
  return { type: 'mixed', label: '복합 관계', verb: '두 기운이 상황에 따라 다르게 만나는 관계' };
}

const factorBlocks = [];
const factorComboBlocks = [];
for (const factor of factorNames) {
  for (const level of levels) {
    const tone = levelTone[level];
    const trait = childFactorTraits[factor];
    factorBlocks.push({
      key: blockKey(['factor', factor, level]),
      factor,
      level,
      summary: factorSummaries[factor][level],
      whyIntro: '{childName}의 {factor} {score}점은 사주에서 {factor}을 만드는 기운과 누르는 기운이 함께 결합되어 나온 결과입니다.',
      dailyBody: [
        `{childName}은 일상에서 ${factorSummaries[factor][level]}이 ${tone.degree} 드러나는 아이입니다. 같은 상황에서도 ${tone.direction} 먼저 살아나기 때문에, 아이의 반응을 속도보다 결의 방향으로 읽어주는 것이 좋습니다.`,
        `${trait.trait}은 하루 컨디션과 환경에 따라 표현이 달라질 수 있습니다. 익숙한 공간에서는 편안하게 드러나고, 낯선 자극이 많을수록 부모님이 리듬을 잡아줄 때 가장 자연스럽게 안정됩니다.`
      ],
      parentingTipTime: {
        title: `${factor} 리듬을 일정 안에 넣어 주세요`,
        body: `{childName}에게 ${factor} 점수는 ${level} 구간에 있습니다. 하루 일과 안에서 이 결이 살아나는 시간과 쉬어가는 시간을 미리 잡아주면, 아이가 자기 속도를 예측하고 더 안정적으로 움직입니다.`
      },
      parentingTipCommunication: {
        title: '비교보다 결의 방향을 먼저 말해 주세요',
        body: `다른 아이와 비교하기보다 {childName}에게 지금 어떤 결이 나타나는지 짚어 주세요. 부모님의 말이 평가가 아니라 안내로 들릴 때, 아이는 자기 반응을 부끄러워하지 않고 조절하는 힘을 배웁니다.`
      },
      parentingTipEnvironment: {
        title: `${factor} 리듬에 맞는 환경 만들기`,
        body: `${factor} 점수가 ${level}인 아이에게는 환경의 강도와 순서가 중요합니다. 자극을 한꺼번에 주기보다 선택지를 줄이고 반복되는 자리를 만들어주면, 아이의 결이 더 안정적으로 자랍니다.`
      }
    });

    for (const maker of sajuInfluenceGroups) {
      for (const suppressor of sajuInfluenceGroups) {
        const dominant = ['매우낮음', '낮음'].includes(level)
          ? 'suppressor'
          : ['높음', '매우높음'].includes(level)
            ? 'maker'
            : 'balanced';
        const makerLead = dominant === 'maker'
          ? `${maker.label}이 ${factor} 점수를 밖으로 드러내는 방향으로 더 분명하게 잡아줍니다`
          : `${maker.label}도 ${factor} 점수를 만들지만, 그 힘이 혼자 크게 앞서지는 않습니다`;
        const suppressorLead = dominant === 'suppressor'
          ? `${suppressor.label}이 ${factor} 결의 속도와 표현을 안쪽으로 조절하는 힘이 더 큽니다`
          : `${suppressor.label}은 ${factor} 결이 한쪽으로 치우치지 않도록 속도를 조절합니다`;
        const conclusion = dominant === 'maker'
          ? `{childName}의 ${factor} 점수는 ${level} 구간에서 ${maker.label}의 작용을 가장 먼저 읽어야 합니다. ${maker.dailyTone}. 그래서 이 결은 일상에서 비교적 쉽게 관찰됩니다.`
          : dominant === 'suppressor'
            ? `{childName}의 ${factor} 점수는 ${level} 구간에서 ${suppressor.label}의 조절을 함께 읽어야 합니다. ${suppressor.dailyTone}. 그래서 이 결은 부족이라기보다 다른 방식으로 드러나는 흐름입니다.`
            : `{childName}의 ${factor} 점수는 ${level} 구간에서 ${maker.label}과 ${suppressor.label}이 서로 균형을 이루며 나타납니다. 한쪽만 강하게 단정하기보다 상황마다 달라지는 반응을 함께 살피는 것이 좋습니다.`;

        factorComboBlocks.push({
          key: blockKey(['factorCombo', factor, level, maker.key, suppressor.key]),
          factor,
          level,
          makerGroup: {
            key: maker.key,
            label: maker.label,
            rawExamples: maker.rawExamples,
          },
          suppressorGroup: {
            key: suppressor.key,
            label: suppressor.label,
            rawExamples: suppressor.rawExamples,
          },
          dominantSide: dominant,
          whyIntro: '{childName}의 {factor} {score}점은 사주에서 {factor}을 만드는 기운과 누르는 기운이 함께 결합되어 나온 결과입니다.',
          whyMechanism: [
            `${makerLead}. 이 기운은 ${maker.mechanism}으로 작용합니다.`,
            `${suppressorLead}. 이 기운은 ${suppressor.mechanism}으로 작용합니다.`,
            conclusion,
          ],
          dailyBody: [
            `{childName}은 ${factor} 관련 장면에서 ${maker.label}과 ${suppressor.label}이 함께 작용하는 모습을 보입니다. ${maker.dailyTone}. 반면 자극이 강하거나 속도가 맞지 않을 때는 ${suppressor.label}의 영향으로 반응을 한 박자 조절하려는 모습도 나타납니다.`,
            `${factorSummaries[factor][level]}이 기본 방향이지만, 실제 일상에서는 사주 안의 두 기운이 만나는 방식에 따라 표현이 달라집니다. 부모님은 점수만 보기보다 어떤 기운이 만들고 어떤 기운이 조절하는지를 함께 봐주시는 것이 좋습니다.`
          ],
          parentingTipTime: {
            title: `${maker.label}과 ${suppressor.label}의 리듬 맞추기`,
            body: `{childName}의 ${factor} 점수는 ${maker.label}이 만들어내는 흐름과 ${suppressor.label}이 조절하는 흐름을 함께 봐야 합니다. 활동을 바로 시작하기보다 예고, 실행, 회복의 순서를 일정 안에 넣어주면 아이가 자기 결을 더 안정적으로 사용합니다.`
          },
          parentingTipCommunication: {
            title: '점수보다 작용하는 기운을 말로 풀어 주세요',
            body: `{childName}에게는 "${factor} 점수가 ${level}이다"보다 "이럴 때는 마음이 먼저 움직이고, 이럴 때는 속도를 조절하는구나"처럼 말해주는 편이 좋습니다. 평가보다 작용 방식을 설명해주면 아이가 자기 반응을 더 쉽게 받아들입니다.`
          },
          parentingTipEnvironment: {
            title: '만드는 기운과 조절하는 기운이 함께 놓일 자리',
            body: `${maker.label}이 살아날 수 있는 선택지와 ${suppressor.label}이 편안하게 작용할 수 있는 안정 장치를 함께 마련해 주세요. 아이에게는 자유만 주거나 기준만 주는 것보다, 움직일 수 있는 범위와 돌아올 수 있는 자리가 같이 있을 때 결이 가장 자연스럽습니다.`
          }
        });
      }
    }
  }
}

const parentSajuBlocks = [];
for (const role of roles) {
  for (const dm of dayMasters) {
    parentSajuBlocks.push({
      key: blockKey(['parentSaju', role.key, dm.key]),
      role: role.key,
      roleTitle: role.title,
      dayMaster: `${dm.ko}(${dm.han})`,
      parentSajuBody: `{parentName}의 일간은 ${dm.ko}(${dm.han})입니다. ${dm.ko}는 ${dm.plain}입니다. 사주 안에서 강하게 자리한 기운들이 이 일간과 만나면, ${role.title}의 결은 가족 안에서 {parentMainTrait} 흐름으로 드러납니다. 이 결은 크게 앞서가기보다 자기 방식으로 관계와 생활의 리듬을 만들어가는 자리입니다.`,
      parentSajuBridge: `이 ${dm.metaphor}의 결이 {childName}의 결과 만나는 자리는 뒤쪽의 함께 살펴줄 결에서 더 구체적으로 정리됩니다.`
    });
  }
}

const compatibilityBlocks = [];
for (const role of roles) {
  for (const child of dayMasters) {
    for (const parent of dayMasters) {
      const rel = relationType(child, parent);
      compatibilityBlocks.push({
        key: blockKey(['compatibility', role.key, child.key, parent.key, rel.type]),
        role: role.key,
        childDayMaster: `${child.ko}(${child.han})`,
        parentDayMaster: `${parent.ko}(${parent.han})`,
        relationType: rel.type,
        relationLabel: rel.label,
        compatibilityTitle: `{parentTitle}과 {childName}의 결합`,
        compatibilityBody: [
          `{parentTitle}은 ${parent.metaphor}(${parent.ko}), {childName}은 ${child.metaphor}(${child.ko})의 결을 가지고 있습니다. 두 기운은 명리에서 ${rel.label}로 볼 수 있으며, ${rel.verb}로 풀이할 수 있습니다.`,
          `이 관계는 성격을 단정하는 말이 아니라, 두 사람이 함께 있을 때 어떤 반응이 자연스럽게 생기는지를 보는 설명입니다. {parentTitle}의 결이 {childName}에게 닿는 방식과 {childName}이 다시 반응하는 속도가 이 궁합의 핵심입니다.`,
          `따라서 두 결이 만날 때에는 한쪽을 맞고 틀림으로 보기보다, 서로의 속도와 방향을 맞추는 것이 중요합니다. 그 균형이 잡히면 {childName}은 {parentTitle} 곁에서 자기 결을 더 편안하게 드러낼 수 있습니다.`
        ],
        compatibilityDaily: `일상에서는 {parentTitle}이 {childName}에게 먼저 방향을 보여주고, {childName}이 그 반응을 살피며 자기 속도를 잡는 장면이 자주 나타납니다. 익숙한 말투와 반복되는 루틴 안에서 두 결은 더 안정적으로 만납니다.`
      });
    }
  }
}

const palaceAxes = parentAxes.slice(0, 5);
const parentPalaceBlocks = [];
for (const motherAxis of palaceAxes) {
  for (const fatherAxis of palaceAxes) {
    parentPalaceBlocks.push({
      key: blockKey(['parentPalace', motherAxis.key, fatherAxis.key]),
      motherAxis: motherAxis.label,
      fatherAxis: fatherAxis.label,
      parentPalaceSummary: [
        `아이 사주 안에서 어머님은 ${motherAxis.label}으로, 아버님은 ${fatherAxis.label}으로 읽힙니다. 이것은 실제 부모님의 전부를 단정하는 말이 아니라, 아이가 부모의 자리를 어떤 흐름으로 받아들이기 쉬운지를 보여주는 기준입니다.`,
        `어머님의 ${motherAxis.daily}과 아버님의 ${fatherAxis.daily}이 함께 들어오면, 아이는 정서적 반응과 생활의 기준을 동시에 배웁니다. 두 흐름의 속도가 맞을수록 아이의 결은 더 안정적으로 자리를 잡습니다.`
      ]
    });
  }
}

const strengthLabels = [
  { key: 'soft', label: '은은한', text: '부드럽게' },
  { key: 'middle', label: '보통', text: '분명하게' },
  { key: 'strong', label: '강한', text: '깊게' },
];

const matrixCardBlocks = [];
for (const role of roles) {
  for (const axis of parentAxes) {
    for (const factor of factorNames) {
      for (const type of ['synergy', 'conflict']) {
        for (const strength of strengthLabels) {
          const factorTrait = childFactorTraits[factor].trait;
          const isSynergy = type === 'synergy';
          matrixCardBlocks.push({
            key: blockKey(['matrix', role.key, axis.key, factor, type, strength.key]),
            role: role.key,
            parentAxis: axis.label,
            childFactor: factor,
            type,
            strength: strength.label,
            header: isSynergy
              ? `{childName}의 ${factorTrait}을 {parentTitle}의 ${axis.label}이 ${strength.text} 받쳐주는 자리`
              : `{parentTitle}의 ${axis.label}이 {childName}의 ${factorTrait}과 부딪힐 수 있는 자리`,
            subTemplate: `${strength.label} ${isSynergy ? '시너지' : '충돌'} - {parentTitle}의 ${axis.label}({parentAxisScore}) x {childName}의 ${factor}({childFactorScore})`,
            body: isSynergy ? [
              `{parentTitle}의 ${axis.label}은 ${axis.daily}입니다. 이 흐름은 {childName}의 ${factorTrait}이 흔들리지 않고 자기 자리를 찾도록 ${strength.text} 받쳐줍니다.`,
              `{childName}에게 ${factor}은 중요한 생활 반응으로 나타납니다. 부모님의 결이 이 반응을 인정해줄 때, 아이는 방어하기보다 자기 속도로 열리는 쪽을 선택합니다.`,
              `두 결이 만나면 {parentTitle}의 흐름이 {childName}의 ${factor}을 자연스럽게 지지하는 자리가 됩니다. 아이가 가장 편안하게 자라는 방향을 함께 만들어갈 수 있습니다.`
            ] : [
              `{parentTitle}의 ${axis.label}은 ${axis.daily}입니다. 이 흐름이 빠르거나 강하게 전달되면 {childName}의 ${factorTrait}이 먼저 긴장할 수 있습니다.`,
              `{childName}의 ${factor}은 자기 속도와 반응 시간이 필요한 결입니다. 부모님의 의도가 좋아도 전달 속도가 맞지 않으면 아이에게는 압박이나 재촉처럼 느껴질 수 있습니다.`,
              `이 충돌은 나쁜 궁합이라는 뜻이 아닙니다. 부모님의 결을 한 박자 낮추고 아이가 받아들일 수 있는 크기로 나누면, 같은 흐름도 아이를 도와주는 기준으로 바뀔 수 있습니다.`
            ],
            daily: isSynergy ? [
              `{childName}이 ${factor}과 관련된 반응을 보일 때 {parentTitle}이 먼저 안정된 말투로 받아주면, 아이의 표정과 행동이 한 박자 부드러워집니다.`,
              `반복되는 루틴 안에서 {parentTitle}의 ${axis.label}이 일정하게 전해질수록 {childName}은 다음 상황을 예측하고 더 편안하게 움직입니다.`
            ] : [
              `{parentTitle}이 좋은 뜻으로 바로잡거나 재촉할 때, {childName}이 말수가 줄거나 한 박자 물러서는 모습이 나타날 수 있습니다.`,
              `이럴 때는 설명을 길게 하기보다 먼저 속도를 낮추고, 아이가 받아들일 수 있는 한 가지 행동만 짚어주는 편이 좋습니다.`
            ],
            resolution: isSynergy ? null : `이렇게 풀어보세요. {parentTitle}의 ${axis.label}을 바로 밀어붙이기보다, 먼저 {childName}의 ${factorTrait}을 인정해 주세요. 그 다음 한 단계 낮은 말투와 작은 선택지로 방향을 제시하면 충돌이 줄고 협력으로 이어집니다.`
          });
        }
      }
    }
  }
}

writeJson('factor-blocks.json', {
  schemaVersion: 'youa-block-cache-v1',
  blockSet: 'factor',
  count: factorBlocks.length,
  blocks: factorBlocks,
});

writeJson('factor-combo-blocks.json', {
  schemaVersion: 'youa-block-cache-v1',
  blockSet: 'factorCombo',
  count: factorComboBlocks.length,
  lookup: {
    keyFormat: 'factorCombo|{factor}|{level}|{makerGroup}|{suppressorGroup}',
    makerGroupSource: '사주 엔진이 factorEvidence.makers 중 가장 우세한 통칭 그룹을 선택',
    suppressorGroupSource: '사주 엔진이 factorEvidence.suppressors 중 가장 우세한 통칭 그룹을 선택',
    fallback: 'maker/suppressor가 비어 있으면 climate 또는 support로 보정하되, 원본 근거 표에는 없는 인자를 만들지 않는다.'
  },
  groups: sajuInfluenceGroups,
  blocks: factorComboBlocks,
});

writeJson('parent-saju-blocks.json', {
  schemaVersion: 'youa-block-cache-v1',
  blockSet: 'parentSaju',
  count: parentSajuBlocks.length,
  blocks: parentSajuBlocks,
});

writeJson('compatibility-blocks.json', {
  schemaVersion: 'youa-block-cache-v1',
  blockSet: 'compatibility',
  count: compatibilityBlocks.length,
  blocks: compatibilityBlocks,
});

writeJson('parent-palace-blocks.json', {
  schemaVersion: 'youa-block-cache-v1',
  blockSet: 'parentPalace',
  count: parentPalaceBlocks.length,
  blocks: parentPalaceBlocks,
});

writeJson('matrix-card-blocks.json', {
  schemaVersion: 'youa-block-cache-v1',
  blockSet: 'matrixCard',
  count: matrixCardBlocks.length,
  blocks: matrixCardBlocks,
});

writeJson('index.json', {
  schemaVersion: 'youa-block-cache-v1',
  generatedAt: new Date().toISOString(),
  files: [
    { name: 'factor-blocks.json', count: factorBlocks.length },
    { name: 'factor-combo-blocks.json', count: factorComboBlocks.length },
    { name: 'parent-saju-blocks.json', count: parentSajuBlocks.length },
    { name: 'compatibility-blocks.json', count: compatibilityBlocks.length },
    { name: 'parent-palace-blocks.json', count: parentPalaceBlocks.length },
    { name: 'matrix-card-blocks.json', count: matrixCardBlocks.length },
  ],
  totalBlocks: factorBlocks.length + factorComboBlocks.length + parentSajuBlocks.length + compatibilityBlocks.length + parentPalaceBlocks.length + matrixCardBlocks.length,
});

console.log(`Generated ${factorBlocks.length + factorComboBlocks.length + parentSajuBlocks.length + compatibilityBlocks.length + parentPalaceBlocks.length + matrixCardBlocks.length} blocks in ${cacheDir}`);
