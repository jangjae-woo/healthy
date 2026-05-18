import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIRS = [
  path.join(ROOT, 'cache'),
  path.resolve(ROOT, '..', '..', 'lib', 'youa-engine', 'youa', 'block-cache-data'),
];

const ROLES = ['mother', 'father'];
const AXES = {
  support: '받쳐주는 기운',
  standard: '기준을 세우는 기운',
  consistent: '꾸준히 이어가는 기운',
  same: '자율을 열어주는 기운',
  expression: '표현으로 풀어내는 기운',
  result: '결과를 향해 모으는 기운',
};
const FACTORS = {
  hwalgi: '활기',
  josim: '조심',
  manjok: '만족',
  heundeullim: '흔들림',
  eoullim: '어울림',
  kkeungi: '끈기',
};
const CAUSES = {
  general: {
    label: '전체 흐름',
    parent: '부모님의 전체 사주 흐름이',
    child: '아이의 전체 기질 흐름이',
  },
  gwanseong: {
    label: '관성',
    parent: '관성의 질서와 책임감이',
    child: '규칙과 긴장을 민감하게 받아들이는 결이',
  },
  inseong: {
    label: '인성',
    parent: '인성의 보호하고 품어 주는 기운이',
    child: '받아들임과 안정감을 필요로 하는 결이',
  },
  siksang: {
    label: '식상',
    parent: '식상의 표현하고 풀어내는 기운이',
    child: '밖으로 표현하려는 결이',
  },
  jaeseong: {
    label: '재성',
    parent: '재성의 현실 감각과 결과를 보는 기운이',
    child: '손에 잡히는 확인을 필요로 하는 결이',
  },
  bigyeop: {
    label: '비겁',
    parent: '비겁의 자기 페이스와 독립성이',
    child: '자기 방식으로 버티려는 결이',
  },
  yangin: {
    label: '양인',
    parent: '양인의 단단한 추진력과 힘이',
    child: '강하게 버티거나 맞서는 결이',
  },
  johu_imbalance: {
    label: '조후 불균형',
    parent: '조후의 치우침을 조절하려는 흐름이',
    child: '기운의 온도차를 크게 느끼는 결이',
  },
  chilsal_sinyak: {
    label: '칠살/신약',
    parent: '강한 기준을 다루는 흐름이',
    child: '강한 압박을 먼저 느끼는 결이',
  },
  gwanin_sangsaeng: {
    label: '관인상생',
    parent: '기준과 보호가 이어지는 흐름이',
    child: '기준을 안정감으로 바꾸려는 결이',
  },
  unseong_strong: {
    label: '12운성 강세',
    parent: '12운성의 힘 있는 자리감이',
    child: '몸과 마음의 반응이 빠르게 올라오는 결이',
  },
  unseong_weak: {
    label: '12운성 약세',
    parent: '12운성의 조심스러운 자리감이',
    child: '에너지를 아껴 쓰려는 결이',
  },
  neutral_strength: {
    label: '중화',
    parent: '중화된 균형감이',
    child: '한쪽으로 치우치기보다 상황을 살피는 결이',
  },
};

const CAUSE_KEYS = Object.keys(CAUSES);
const CAUSE_KEY_ALIAS = {
  johu_imbalance: 'johu-imbalance',
  chilsal_sinyak: 'chilsal-sinyak',
  gwanin_sangsaeng: 'gwanin-sangsaeng',
  unseong_strong: 'unseong-strong',
  unseong_weak: 'unseong-weak',
  neutral_strength: 'neutral-strength',
};

function cacheCauseKey(key) {
  return CAUSE_KEY_ALIAS[key] ?? key;
}

function roleLabel(role) {
  return role === 'mother' ? '어머님' : '아버님';
}

function factorObjectParticle(factor) {
  return ['활기', '조심', '만족', '끈기'].includes(factor) ? '을' : '을';
}

function makeHeader({ role, axis, factor, type }) {
  const p = '{parentTitle}';
  const c = '{childName}';
  if (type === 'conflict') {
    return `${p}의 ${AXES[axis]}이 ${c}의 ${factor}${factorObjectParticle(factor)} 흔들 수 있는 자리`;
  }
  return `${c}의 ${factor}${factorObjectParticle(factor)} ${p}의 ${AXES[axis]}이 받쳐주는 자리`;
}

function makeSub({ axis, factor, type }) {
  const label = type === 'conflict' ? '충돌 가능성' : '강점으로 이어지는 흐름';
  return `${label} - {parentTitle} ${AXES[axis]} x {childName} ${factor}`;
}

function makeBody({ role, axis, factor, type, parentCause, childCause }) {
  const parent = CAUSES[parentCause];
  const child = CAUSES[childCause];
  const p = '{parentTitle}';
  const c = '{childName}';
  const r = roleLabel(role);
  const axisText = AXES[axis];
  const factorText = FACTORS[factor];

  if (type === 'conflict') {
    return [
      `${r} 쪽에서는 ${parent.parent} ${axisText}으로 나타나고, ${c} 쪽에서는 ${child.child} ${factorText}의 반응으로 올라옵니다. 두 흐름이 같은 방향으로 맞물리기보다 속도와 기대치가 달라질 때 긴장이 생기기 쉽습니다.`,
      `${p}의 의도는 아이를 밀어붙이려는 것이 아니라 방향을 잡아 주려는 쪽에 가깝습니다. 다만 ${c}는 ${child.label}의 결 때문에 그 기준을 도움보다 압박으로 먼저 느낄 수 있습니다.`,
      `그래서 이 자리는 나쁜 궁합이라기보다 조율이 필요한 자리입니다. ${p}가 ${parent.label}의 힘을 조금 낮추고, ${c}의 ${factorText}이 반응할 시간을 먼저 주면 같은 흐름도 훨씬 부드럽게 바뀝니다.`,
    ];
  }

  return [
    `${r} 쪽에서는 ${parent.parent} ${axisText}으로 나타나고, ${c} 쪽에서는 ${child.child} ${factorText}의 결로 드러납니다. 서로 다른 출발점이지만 만나면 아이가 자기 결을 안정적으로 쓰도록 도와주는 자리입니다.`,
    `${p}의 흐름은 ${c}를 대신 끌고 가기보다, 아이가 이미 가진 ${child.label}의 반응을 알아보고 형태를 잡아 주는 쪽에 가깝습니다. 그래서 이 조합은 과하게 설명하지 않아도 생활 안에서 힘을 발휘합니다.`,
    `특히 ${c}가 ${factorText}을 드러내는 순간에 ${p}의 ${parent.label} 흐름이 맞춰 들어오면, 아이는 자기 모습이 받아들여진다고 느낍니다. 그때 부모님의 기준과 아이의 결이 같은 방향으로 이어집니다.`,
  ];
}

function makeDaily({ type, parentCause, childCause }) {
  const parent = CAUSES[parentCause];
  const child = CAUSES[childCause];
  if (type === 'conflict') {
    return [
      `{childName}가 바로 반응하지 못할 때는 먼저 짧게 멈추고, 지금 필요한 기준을 한 문장으로 줄여 주는 편이 좋습니다.`,
      `{parentTitle}의 ${parent.label} 흐름이 강하게 올라오는 날에는 ${child.label}의 반응을 확인한 뒤 다음 행동으로 넘어가면 긴장이 줄어듭니다.`,
    ];
  }
  return [
    `{childName}가 자기 페이스를 보일 때 {parentTitle}가 먼저 알아봐 주면, 아이의 반응이 훨씬 안정적으로 이어집니다.`,
    `{parentTitle}의 ${parent.label} 흐름은 ${child.label}의 결을 생활 속에서 붙잡아 주는 기준점으로 쓰기 좋습니다.`,
  ];
}

function makeResolution({ type }) {
  if (type !== 'conflict') return null;
  return '{parentTitle}가 먼저 속도를 낮추고, {childName}에게 선택지 두 개 정도를 보여 준 뒤 따라올 시간을 주면 좋습니다.';
}

const blocks = [];
for (const role of ROLES) {
  for (const axis of Object.keys(AXES)) {
    for (const factor of Object.keys(FACTORS)) {
      for (const type of ['synergy', 'conflict']) {
        for (const parentCause of CAUSE_KEYS) {
          for (const childCause of CAUSE_KEYS) {
            blocks.push({
              key: `matrixCombo|slot11_21|${role}|${axis}|${factor}|${type}|p=${cacheCauseKey(parentCause)}|c=${cacheCauseKey(childCause)}`,
              slot: '11_21',
              role,
              parentAxis: axis,
              childFactor: factor,
              type,
              parentCause: cacheCauseKey(parentCause),
              childCause: cacheCauseKey(childCause),
              header: makeHeader({ role, axis, factor: FACTORS[factor], type }),
              subTemplate: makeSub({ axis, factor: FACTORS[factor], type }),
              body: makeBody({ role, axis, factor, type, parentCause, childCause }),
              daily: makeDaily({ type, parentCause, childCause }),
              resolution: makeResolution({ type }),
            });
          }
        }
      }
    }
  }
}

const payload = {
  schemaVersion: 'youa-numbered-combo-cache-v1',
  blockSet: 'matrixCombo',
  generatedAt: new Date().toISOString(),
  count: blocks.length,
  blocks,
};

for (const outDir of OUT_DIRS) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'matrix-combo-blocks.json'), JSON.stringify(payload, null, 2), 'utf8');

  const indexPath = path.join(outDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const files = (index.files ?? []).filter(file => file.name !== 'matrix-combo-blocks.json');
    files.push({ name: 'matrix-combo-blocks.json', count: blocks.length });
    index.files = files;
    index.totalBlocks = files.reduce((sum, file) => sum + Number(file.count ?? 0), 0);
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  }
}

console.log(`matrix-combo-blocks.json generated: ${blocks.length} blocks`);
