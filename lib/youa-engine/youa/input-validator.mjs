// 입력 검증 (Phase 6)
//
// 폼 입력 → 검증 → 정규화된 객체
// 자녀 생년월일 컷오프: 2020-01-01 ~ 2023-12-31 (만 3~만 6 가까이)
//
// 작성: 2026-05-17

// 자녀 생년월일 범위
const CHILD_BIRTH_MIN = '2020-01-01';
const CHILD_BIRTH_MAX = '2023-12-31';

// 시지 옵션
export const HOUR_OPTIONS = [
  { value: '시간 모름', label: '시간 모름' },
  { value: '자시 (23:30~01:29)', label: '자시 (23:30~01:29)' },
  { value: '축시 (01:30~03:29)', label: '축시 (01:30~03:29)' },
  { value: '인시 (03:30~05:29)', label: '인시 (03:30~05:29)' },
  { value: '묘시 (05:30~07:29)', label: '묘시 (05:30~07:29)' },
  { value: '진시 (07:30~09:29)', label: '진시 (07:30~09:29)' },
  { value: '사시 (09:30~11:29)', label: '사시 (09:30~11:29)' },
  { value: '오시 (11:30~13:29)', label: '오시 (11:30~13:29)' },
  { value: '미시 (13:30~15:29)', label: '미시 (13:30~15:29)' },
  { value: '신시 (15:30~17:29)', label: '신시 (15:30~17:29)' },
  { value: '유시 (17:30~19:29)', label: '유시 (17:30~19:29)' },
  { value: '술시 (19:30~21:29)', label: '술시 (19:30~21:29)' },
  { value: '해시 (21:30~23:29)', label: '해시 (21:30~23:29)' },
];

// 만 나이 계산
export function calcAge(birthDate, refDate = new Date().toISOString().slice(0, 10)) {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ry, rm, rd] = refDate.split('-').map(Number);
  let years = ry - by;
  let months = rm - bm;
  let days = rd - bd;
  if (days < 0) { months -= 1; }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, label: `만 ${years}세 ${months}개월` };
}

// 자녀 입력 검증
export function validateChildInput(input) {
  const errors = [];

  if (!input.name?.trim()) errors.push({ field: 'name', message: '자녀 이름을 입력해 주세요' });
  if (!['female', 'male'].includes(input.gender)) errors.push({ field: 'gender', message: '성별을 선택해 주세요' });
  if (!input.birthDate) errors.push({ field: 'birthDate', message: '생년월일을 입력해 주세요' });

  if (input.birthDate) {
    if (input.birthDate < CHILD_BIRTH_MIN || input.birthDate > CHILD_BIRTH_MAX) {
      errors.push({
        field: 'birthDate',
        message: `자녀 생년월일은 ${CHILD_BIRTH_MIN} ~ ${CHILD_BIRTH_MAX} 사이여야 합니다 (만 3~만 6 가까이)`,
      });
    }
  }

  if (!input.hour) errors.push({ field: 'hour', message: '태어난 시간을 선택해 주세요' });
  if (!['solar', 'lunar'].includes(input.calendar)) errors.push({ field: 'calendar', message: '양력/음력을 선택해 주세요' });

  return { valid: errors.length === 0, errors };
}

// 부모 입력 검증 (선택)
export function validateParentInput(input, role) {
  if (!input) return { valid: true, errors: [] };  // 미입력 OK

  const errors = [];
  const label = role === 'mother' ? '어머님' : '아버님';

  if (!input.name?.trim()) errors.push({ field: `${role}.name`, message: `${label} 이름을 입력해 주세요` });
  if (!input.birthDate) errors.push({ field: `${role}.birthDate`, message: `${label} 생년월일을 입력해 주세요` });
  if (!input.hour) errors.push({ field: `${role}.hour`, message: `${label} 태어난 시간을 선택해 주세요` });
  if (!['solar', 'lunar'].includes(input.calendar)) errors.push({ field: `${role}.calendar`, message: `${label} 양력/음력을 선택해 주세요` });

  return { valid: errors.length === 0, errors };
}

// 전체 입력 검증
export function validateAllInput(input) {
  const childResult = validateChildInput(input.child);
  const motherResult = input.mother ? validateParentInput(input.mother, 'mother') : { valid: true, errors: [] };
  const fatherResult = input.father ? validateParentInput(input.father, 'father') : { valid: true, errors: [] };

  const allErrors = [...childResult.errors, ...motherResult.errors, ...fatherResult.errors];

  // 부모 최소 1명 입력 필요
  if (!input.mother && !input.father) {
    allErrors.push({ field: 'parent', message: '어머님 또는 아버님 중 최소 1명의 정보가 필요합니다' });
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
