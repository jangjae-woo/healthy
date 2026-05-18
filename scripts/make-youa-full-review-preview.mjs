import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.YOUA_PREVIEW_BASE_URL ?? 'http://localhost:3456';
const OUT_DIR = path.resolve('아이기질브라덜', 'review');
const OUT_FILE = path.join(OUT_DIR, 'youa-full-review-preview.html');

const samples = [
  {
    id: 'sample-01-random-child',
    label: '랜덤 아이 사주 A / 기존 업로드 부모 조합',
    input: {
      child: { name: '박하윤', birthDate: '2021-07-19', gender: 'female', hour: '진시 (07:30~09:29)' },
      mother: { name: '장은실', birthDate: '1999-09-15', hour: '축시 (01:30~03:29)' },
      father: { name: '김태산', birthDate: '2000-12-01', hour: '유시 (17:30~19:29)' },
    },
  },
  {
    id: 'sample-02-balanced',
    label: '일반 균형형 / 부모 양쪽 모두 시간 있음',
    input: {
      child: { name: '이금희', birthDate: '2021-12-11', gender: 'female', hour: '축시 (01:30~03:29)' },
      mother: { name: '한선화', birthDate: '1999-09-12', hour: '자시 (23:30~01:29)' },
      father: { name: '김호랑', birthDate: '1989-11-11', hour: '축시 (01:30~03:29)' },
    },
  },
  {
    id: 'sample-03-child-unknown-hour',
    label: '아이 시간 모름 / 기존 업로드 부모 조합',
    input: {
      child: { name: '최서아', birthDate: '2022-05-18', gender: 'female', hour: '시간 모름' },
      mother: { name: '장은실', birthDate: '1999-09-15', hour: '축시 (01:30~03:29)' },
      father: { name: '김태산', birthDate: '2000-12-01', hour: '유시 (17:30~19:29)' },
    },
  },
  {
    id: 'sample-04-high-activity',
    label: '다른 아이 날짜 / 기존 업로드 부모 조합 A',
    input: {
      child: { name: '서지안', birthDate: '2023-01-09', gender: 'female', hour: '오시 (11:30~13:29)' },
      mother: { name: '장은실', birthDate: '1999-09-15', hour: '축시 (01:30~03:29)' },
      father: { name: '김태산', birthDate: '2000-12-01', hour: '유시 (17:30~19:29)' },
    },
  },
  {
    id: 'sample-05-boy',
    label: '남아 샘플',
    input: {
      child: { name: '이도윤', birthDate: '2020-09-22', gender: 'male', hour: '신시 (15:30~17:29)' },
      mother: { name: '한선화', birthDate: '1999-09-12', hour: '자시 (23:30~01:29)' },
      father: { name: '김호랑', birthDate: '1989-11-11', hour: '축시 (01:30~03:29)' },
    },
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resultUrl(input, id) {
  const params = new URLSearchParams({
    childName: input.child.name,
    childBirthDate: input.child.birthDate,
    childGender: input.child.gender,
    childHour: input.child.hour,
    childCalendar: '양력',
    motherName: input.mother.name,
    motherBirthDate: input.mother.birthDate,
    motherHour: input.mother.hour,
    motherCalendar: '양력',
    fatherName: input.father.name,
    fatherBirthDate: input.father.birthDate,
    fatherHour: input.father.hour,
    fatherCalendar: '양력',
    unlocked: '1',
    paymentId: `local-full-review-${id}`,
  });
  return `${BASE_URL}/love/youa/result?${params.toString()}`;
}

async function fetchReport(sample) {
  const response = await fetch(`${BASE_URL}/api/youa-family-report`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...sample.input, includeFacts: true }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.ok) {
    return {
      ok: false,
      status: response.status,
      error: json?.error ?? response.statusText,
      url: resultUrl(sample.input, sample.id),
    };
  }
  return {
    ok: true,
    status: response.status,
    summary: json.summary,
    validation: json.validation,
    cacheKeys: json.cacheKeys,
    facts: json.facts,
    html: json.html,
    url: resultUrl(sample.input, sample.id),
  };
}

function judgmentSummary(report) {
  const facts = report.facts;
  if (!facts) return '';
  const factors = Object.entries(facts.childFactors ?? {})
    .map(([key, value]) => `${key}:${Math.round(Number(value.score) || 0)}/${value.level ?? ''}`)
    .join(' · ');
  const motherCards = facts.matrixCards?.motherCards?.map(card => `${card.axis}-${card.factor}-${card.pattern}`).join(', ') ?? '';
  const fatherCards = facts.matrixCards?.fatherCards?.map(card => `${card.axis}-${card.factor}-${card.pattern}`).join(', ') ?? '';
  return `
    <dl>
      <dt>아이 동물/케이스</dt><dd>${escapeHtml(facts.animal?.name)} / ${escapeHtml(facts.animal?.caseLabel ?? facts.animal?.case)}</dd>
      <dt>6요인</dt><dd>${escapeHtml(factors)}</dd>
      <dt>어머님 카드</dt><dd>${escapeHtml(motherCards)}</dd>
      <dt>아버님 카드</dt><dd>${escapeHtml(fatherCards)}</dd>
      <dt>검수</dt><dd>${escapeHtml(report.validation?.valid ? '통과' : '실패')}</dd>
    </dl>
  `;
}

function sampleSection(sample, report) {
  if (!report.ok) {
    return `
      <section class="sample error">
        <h2>${escapeHtml(sample.label)}</h2>
        <p class="meta">${escapeHtml(sample.id)}</p>
        <p>API 실패: ${escapeHtml(report.status)} ${escapeHtml(report.error)}</p>
        <p><a href="${escapeHtml(report.url)}" target="_blank">결과 URL 열기</a></p>
      </section>
    `;
  }

  return `
    <section class="sample">
      <header>
        <h2>${escapeHtml(sample.label)}</h2>
        <p class="meta">${escapeHtml(sample.id)} · <a href="${escapeHtml(report.url)}" target="_blank">실제 결과 화면 열기</a></p>
      </header>
      <div class="summary">${judgmentSummary(report)}</div>
      <details>
        <summary>렌더 HTML 펼쳐보기</summary>
        <div class="report-html">${report.html}</div>
      </details>
    </section>
  `;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const reports = [];
for (const sample of samples) {
  console.log(`fetching ${sample.id}`);
  reports.push([sample, await fetchReport(sample)]);
}

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>아이기질과 부모양육 통합 리뷰 프리뷰</title>
  <style>
    body { margin: 0; font-family: Arial, "Noto Sans KR", sans-serif; background: #f5f2ed; color: #2f2a26; }
    .wrap { max-width: 1180px; margin: 0 auto; padding: 28px 18px 80px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    .lead { margin: 0 0 22px; color: #6b625a; font-size: 14px; line-height: 1.7; }
    .sample { background: #fff; border: 1px solid #e2d8cc; border-radius: 10px; padding: 18px; margin: 18px 0; }
    .sample.error { border-color: #d85f5f; background: #fff8f8; }
    h2 { font-size: 18px; margin: 0 0 4px; }
    .meta { margin: 0 0 12px; color: #7a6f66; font-size: 12px; }
    a { color: #875a2a; font-weight: 700; }
    .summary { background: #faf7f2; border: 1px solid #eadfD2; border-radius: 8px; padding: 12px 14px; margin: 12px 0; }
    dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; margin: 0; font-size: 13px; line-height: 1.5; }
    dt { font-weight: 700; color: #5e5146; }
    dd { margin: 0; color: #3d352e; }
    details { margin-top: 12px; }
    summary { cursor: pointer; font-weight: 700; color: #6d4b25; }
    .report-html { margin-top: 14px; border-top: 1px solid #eadfd2; padding-top: 14px; }
    .report-html .page { margin: 16px auto; box-shadow: 0 4px 18px rgba(0,0,0,.08); }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>아이기질과 부모양육 통합 리뷰 프리뷰</h1>
    <p class="lead">로컬 API 기준으로 샘플을 한 번에 호출해 만든 리뷰 파일입니다. 각 샘플의 실제 결과 URL과 렌더 HTML을 함께 확인할 수 있습니다.</p>
    ${reports.map(([sample, report]) => sampleSection(sample, report)).join('\n')}
  </div>
</body>
</html>`;

fs.writeFileSync(OUT_FILE, html, 'utf8');
console.log(`wrote ${OUT_FILE}`);
