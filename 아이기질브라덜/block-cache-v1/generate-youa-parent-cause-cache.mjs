import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIRS = [
  path.join(ROOT, 'cache'),
  path.resolve(ROOT, '..', '..', 'lib', 'youa-engine', 'youa', 'block-cache-data'),
];

const ROLES = ['mother', 'father'];
const STEMS = {
  gap: ['갑목(甲)', '큰 나무', '곧게 자라 방향을 세우는'],
  eul: ['을목(乙)', '작은 풀과 덩굴', '부드럽게 스며들며 적응하는'],
  byeong: ['병화(丙)', '큰 태양', '밝게 드러내고 주변을 비추는'],
  jeong: ['정화(丁)', '작은 불빛', '섬세하게 살피고 온기를 전하는'],
  mu: ['무토(戊)', '큰 산', '쉽게 흔들리지 않고 중심을 잡는'],
  gi: ['기토(己)', '부드러운 흙', '받아들이고 길러내는'],
  gyeong: ['경금(庚)', '큰 쇠도끼', '분명하게 정리하고 결단하는'],
  sin: ['신금(辛)', '작은 보석', '정교하게 다듬고 기준을 세우는'],
  im: ['임수(壬)', '큰 물', '넓게 흐르며 상황을 읽는'],
  gye: ['계수(癸)', '작은 물', '조용히 스며들고 세밀하게 느끼는'],
};
const AXES = {
  ongi: '따뜻하게 받아 주는 방식',
  jungsim: '기준과 방향을 세우는 방식',
  ilgwan: '꾸준히 반복해 주는 방식',
  jayul: '아이의 자리를 열어 주는 방식',
  pyohyeon: '말과 표현으로 풀어 주는 방식',
  baram: '기대와 결과를 보여 주는 방식',
};
const CAUSES = {
  general: '전체 사주 흐름',
  gwanseong: '관성의 책임감과 기준',
  inseong: '인성의 보호와 수용',
  siksang: '식상의 표현과 활동성',
  jaeseong: '재성의 현실감과 결과 의식',
  bigyeop: '비겁의 자기 페이스',
  yangin: '양인의 단단한 힘',
  johu_imbalance: '조후의 온도차',
  chilsal_sinyak: '칠살/신약의 긴장',
  gwanin_sangsaeng: '관인상생의 기준과 보호',
  unseong_strong: '12운성 강세의 힘',
  unseong_weak: '12운성 약세의 조심성',
  neutral_strength: '중화된 균형감',
};
const ALIAS = {
  johu_imbalance: 'johu-imbalance',
  chilsal_sinyak: 'chilsal-sinyak',
  gwanin_sangsaeng: 'gwanin-sangsaeng',
  unseong_strong: 'unseong-strong',
  unseong_weak: 'unseong-weak',
  neutral_strength: 'neutral-strength',
};

function cacheKey(key) {
  return ALIAS[key] ?? key;
}

function makeBlock({ role, stem, axis, cause }) {
  const [dayMaster, image, tone] = STEMS[stem];
  const roleTitle = role === 'mother' ? '어머님' : '아버님';
  const roleFlow = role === 'mother' ? '정서적으로 먼저 닿는 자리' : '방향과 기준으로 닿는 자리';
  return {
    key: `parentCause|slot7_8|${role}|${stem}|axis=${axis}|cause=${cacheKey(cause)}`,
    slot: '7_8',
    role,
    roleTitle,
    dayMaster,
    axis,
    cause: cacheKey(cause),
    parentSajuBody: `{parentName}의 일간은 ${dayMaster}입니다. ${dayMaster}은 ${image}처럼 ${tone} 기운입니다. 여기에 ${CAUSES[cause]}이 함께 작용하면서, ${roleTitle}의 결은 가족 안에서 ${AXES[axis]}으로 드러납니다. 이 흐름은 ${roleFlow}이 되어 {childName}가 부모님의 반응을 느끼는 기본 배경이 됩니다.`,
    parentSajuBridge: `이 ${image}의 결이 {childName}의 결과 만나는 방식은 뒤쪽의 함께 살펴줄 결에서 더 구체적으로 정리됩니다.`,
  };
}

const blocks = [];
for (const role of ROLES) {
  for (const stem of Object.keys(STEMS)) {
    for (const axis of Object.keys(AXES)) {
      for (const cause of Object.keys(CAUSES)) {
        blocks.push(makeBlock({ role, stem, axis, cause }));
      }
    }
  }
}

const payload = {
  schemaVersion: 'youa-numbered-combo-cache-v1',
  blockSet: 'parentCause',
  generatedAt: new Date().toISOString(),
  count: blocks.length,
  blocks,
};

for (const outDir of OUT_DIRS) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'parent-cause-blocks.json'), JSON.stringify(payload, null, 2), 'utf8');

  const indexPath = path.join(outDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const files = (index.files ?? []).filter(file => file.name !== 'parent-cause-blocks.json');
    files.push({ name: 'parent-cause-blocks.json', count: blocks.length });
    index.files = files;
    index.totalBlocks = files.reduce((sum, file) => sum + Number(file.count ?? 0), 0);
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  }
}

console.log(`parent-cause-blocks.json generated: ${blocks.length} blocks`);
