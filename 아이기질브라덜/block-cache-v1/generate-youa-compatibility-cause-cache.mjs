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
  gap: ['갑목(甲)', '큰 나무'],
  eul: ['을목(乙)', '작은 풀'],
  byeong: ['병화(丙)', '큰 태양'],
  jeong: ['정화(丁)', '작은 불빛'],
  mu: ['무토(戊)', '큰 산'],
  gi: ['기토(己)', '부드러운 흙'],
  gyeong: ['경금(庚)', '큰 쇠도끼'],
  sin: ['신금(辛)', '작은 보석'],
  im: ['임수(壬)', '큰 물'],
  gye: ['계수(癸)', '작은 물'],
};

const RELATIONS = {
  same: {
    label: '동기 관계',
    pattern: 'same_element_mirroring',
    care: 'mirroring_and_space',
    risk: 'similarity_can_amplify_stubbornness',
    flow: '비슷한 결이 서로를 알아보고 비추는 흐름',
    daily: '서로의 반응을 빨리 알아차리는 장점이 있지만, 같은 방향으로 고집이 커질 때는 잠시 간격을 두는 편이 좋습니다.',
  },
  parentGivesChild: {
    label: '부모가 아이를 생하는 관계',
    pattern: 'parent_supports_child',
    care: 'support_and_acceptance',
    risk: 'low_relation_risk',
    flow: '부모님의 결이 아이를 받쳐 주고 안정시키는 흐름',
    daily: '아이가 먼저 마음을 열기 전까지 부모님의 안정된 말투와 반복되는 루틴이 큰 지지점이 됩니다.',
  },
  parentControlsChild: {
    label: '부모가 아이에게 기준을 주는 관계',
    pattern: 'parent_sets_boundary',
    care: 'boundary_and_direction',
    risk: 'boundary_may_pressure_sensitive_child',
    flow: '부모님의 결이 아이에게 기준과 방향을 알려 주는 흐름',
    daily: '기준은 필요하지만 강하게 들어가면 아이가 압박으로 느낄 수 있으니, 짧은 예고와 부드러운 확인이 중요합니다.',
  },
  childGivesParent: {
    label: '아이가 부모에게 표현을 보내는 관계',
    pattern: 'child_expresses_to_parent',
    care: 'expression_and_response',
    risk: 'low_relation_risk',
    flow: '아이의 표현이 부모님의 반응을 움직이는 흐름',
    daily: '아이의 말과 행동을 바로 평가하기보다 먼저 받아 주면 관계의 리듬이 훨씬 편안해집니다.',
  },
  childControlsParent: {
    label: '아이가 부모에게 결과를 묻게 하는 관계',
    pattern: 'child_activates_parent_result',
    care: 'result_and_confirmation',
    risk: 'expectation_feedback_loop',
    flow: '아이의 반응이 부모님에게 확인과 결과 의식을 일으키는 흐름',
    daily: '부모님이 성과나 반응을 빨리 확인하려 하면 아이가 부담을 느낄 수 있어, 과정 중심으로 봐주는 편이 좋습니다.',
  },
};

const CHILD_PATTERNS = [
  'active_expression',
  'cautious_stability',
  'sensitive_recovery',
  'social_attachment',
  'social_open',
  'persistent_rhythm',
  'contentment_stability',
  'balanced_moderate',
];

function roleTitle(role) {
  return role === 'mother' ? '어머님' : '아버님';
}

function relationTitle(role, relation) {
  return `${roleTitle(role)}과 {childName}의 ${RELATIONS[relation].label}`;
}

function makeBody({ role, childStem, parentStem, relation, childPattern }) {
  const [childIlgan, childImage] = STEMS[childStem];
  const [parentIlgan, parentImage] = STEMS[parentStem];
  const rel = RELATIONS[relation];
  const parent = roleTitle(role);
  const childPatternText = {
    active_expression: '활동성과 표현이 먼저 살아나는 아이',
    cautious_stability: '조심성과 안정 욕구가 뚜렷한 아이',
    sensitive_recovery: '감정 회복 리듬을 세심하게 봐야 하는 아이',
    social_attachment: '관계 안에서 마음이 열리는 아이',
    social_open: '사람과 장면에 빠르게 반응하는 아이',
    persistent_rhythm: '자기 페이스와 반복 리듬이 중요한 아이',
    contentment_stability: '편안함과 만족감의 기준이 중요한 아이',
    balanced_moderate: '상황을 살피며 균형을 맞추는 아이',
  }[childPattern] ?? '자기 결을 가진 아이';

  return [
    `${parent}은 ${parentImage}의 결을 가진 ${parentIlgan}, {childName}은 ${childImage}의 결을 가진 ${childIlgan}입니다. 두 일간은 명리에서 ${rel.flow}으로 볼 수 있습니다.`,
    `이 설명은 성격을 단정하는 말이 아니라, 두 사람이 함께 있을 때 어떤 반응이 자연스럽게 생기는지를 보는 자리입니다. 특히 {childName}은 ${childPatternText}이기 때문에, ${parent}의 결이 닿는 속도와 방식이 중요합니다.`,
    `따라서 이 관계에서는 한쪽이 맞고 틀리다는 식으로 보기보다, ${parent}의 역할과 {childName}의 반응 리듬을 맞추는 것이 핵심입니다. 그 균형이 잡히면 아이는 부모님 곁에서 자기 결을 더 편안하게 드러낼 수 있습니다.`,
  ];
}

function makeBlock({ role, childStem, parentStem, relation, childPattern }) {
  const rel = RELATIONS[relation];
  return {
    key: `youa.compatibility|role=${role}|childIlgan=${childStem}|parentIlgan=${parentStem}|relationPattern=${rel.pattern}|relationCarePattern=${rel.care}|relationRiskPattern=${rel.risk}|childTemperamentPattern=${childPattern}|tone=brother-index`,
    slot: '09_10',
    role,
    childIlgan: childStem,
    parentIlgan: parentStem,
    relationType: relation,
    relationPattern: rel.pattern,
    relationCarePattern: rel.care,
    relationRiskPattern: rel.risk,
    childTemperamentPattern: childPattern,
    compatibilityTitle: relationTitle(role, relation),
    compatibilityBody: makeBody({ role, childStem, parentStem, relation, childPattern }),
    compatibilityDaily: rel.daily,
  };
}

const blocks = [];
for (const role of ROLES) {
  for (const childStem of Object.keys(STEMS)) {
    for (const parentStem of Object.keys(STEMS)) {
      for (const relation of Object.keys(RELATIONS)) {
        for (const childPattern of CHILD_PATTERNS) {
          blocks.push(makeBlock({ role, childStem, parentStem, relation, childPattern }));
        }
      }
    }
  }
}

const payload = {
  schemaVersion: 'youa-numbered-combo-cache-v1',
  blockSet: 'compatibilityCause',
  generatedAt: new Date().toISOString(),
  count: blocks.length,
  blocks,
};

for (const outDir of OUT_DIRS) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'compatibility-cause-blocks.json'), JSON.stringify(payload, null, 2), 'utf8');

  const indexPath = path.join(outDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const files = (index.files ?? []).filter(file => file.name !== 'compatibility-cause-blocks.json');
    files.push({ name: 'compatibility-cause-blocks.json', count: blocks.length });
    index.files = files;
    index.totalBlocks = files.reduce((sum, file) => sum + Number(file.count ?? 0), 0);
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  }
}

console.log(`compatibility-cause-blocks.json generated: ${blocks.length} blocks`);
