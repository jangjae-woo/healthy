# 다른 컴퓨터로 옮기는 방법

## 🎯 결론부터

```
1. 폴더 통째로 복사 (USB·클라우드·Git)
2. 새 컴퓨터에서 npm install
3. npm run dev
4. localhost:3456 접속
```

---

## 📋 사전 준비 (새 컴퓨터에 필요한 것)

### 필수
| 항목 | 권장 버전 | 확인 명령 |
|---|---|---|
| **Node.js** | 18.17 이상 (20.x 권장) | `node -v` |
| **npm** | 9.x 이상 | `npm -v` |

### 선택
- **Git** (Git으로 옮길 경우)
- **VSCode** (코드 편집·디버깅)
- **PowerShell 7+** (Windows 사용 시)

### Node.js 설치
- Windows/Mac: https://nodejs.org → LTS 버전 다운로드
- 설치 후 새 터미널 열고 `node -v`, `npm -v` 확인

---

## 🚚 마이그레이션 옵션 3가지

### 옵션 A. 폴더 통째로 복사 (가장 쉬움)

1. 현재 컴퓨터에서 `C:\Users\PC\Desktop\사주 개발개발` 폴더 통째로 복사
2. **`node_modules` 폴더는 제외** (크기 크고 OS 종속이라 새로 설치하는 게 빠름)
3. 새 컴퓨터의 원하는 위치(예: 데스크톱)에 붙여넣기
4. 터미널에서 해당 폴더로 이동 후:
   ```bash
   npm install
   npm run dev
   ```

#### 복사 시 제외할 것
- `node_modules/` (자동 재설치됨)
- `.next/` (빌드 캐시, 자동 재생성)
- `.env*.local` (있다면 비밀 키 별도 관리)

#### 복사 시 꼭 포함할 것
- `package.json`, `package-lock.json` ← 의존성 정의
- `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`
- `app/`, `lib/` 전부
- `.claude/launch.json` (Claude Preview 설정, 선택)

---

### 옵션 B. Git 저장소로 옮기기

```bash
# 현재 컴퓨터에서
cd "C:\Users\PC\Desktop\사주 개발개발"
git init
git add .
git commit -m "Initial migration snapshot"
# GitHub/GitLab에 private repo 만들고
git remote add origin <repo-url>
git push -u origin main

# 새 컴퓨터에서
git clone <repo-url>
cd <repo-folder>
npm install
npm run dev
```

**`.gitignore` 권장 내용** (없으면 만드세요):
```
node_modules/
.next/
.env*.local
*.log
.DS_Store
```

---

### 옵션 C. ZIP 압축

```bash
# Windows PowerShell에서
Compress-Archive -Path "C:\Users\PC\Desktop\사주 개발개발\*" `
                 -DestinationPath "C:\Users\PC\Desktop\saju-backup.zip" `
                 -Exclude "node_modules", ".next"
```
→ ZIP 새 컴퓨터로 보낸 뒤 풀고 `npm install` + `npm run dev`.

---

## 🔧 새 컴퓨터에서 실행

### 1단계: 의존성 설치

```bash
cd "사주 개발개발"
npm install
```

처음 받으면 28개 패키지 설치됨 (약 17초). 인터넷 필요.

### 2단계: 개발 서버 실행

```bash
npm run dev
```

성공하면 다음 메시지가 뜹니다:
```
▲ Next.js 14.2.15
- Local:        http://localhost:3456
✓ Ready in 2.2s
```

### 3단계: 브라우저에서 열기

`http://localhost:3456` 접속.

### 4단계: Gemini API 키 입력

1. 사이트 페이지 상단의 *🔑 Gemini API 키* 박스
2. [Google AI Studio](https://aistudio.google.com/apikey) 에서 발급받은 키 붙여넣기
3. *이 브라우저에 저장* 체크하면 다음에 자동 입력됨

### 5단계: 테스트

- 사주풀이 탭: 이름·생년월일 넣고 → "사주 풀이 시작"
- 궁합 탭: 자녀·부모 정보 넣고 → "부모-자녀 궁합 분석 시작"

---

## 🐛 자주 마주치는 오류

### ❌ `Cannot find module '@/lib/...'`
→ TypeScript paths 설정 문제. [`tsconfig.json`](../tsconfig.json) 의 `"paths": { "@/*": ["./*"] }` 부분 확인.

### ❌ `Port 3456 is already in use`
→ 다른 프로세스가 포트 점유 중. `netstat -ano | findstr 3456` 으로 확인 후 종료, 또는 [`package.json`](../package.json) 의 `dev` 스크립트에서 다른 포트(예: `-p 3457`)로 변경.

### ❌ `Module not found: Can't resolve 'next'`
→ `npm install` 안 됐거나 실패. `node_modules` 삭제 후 재설치:
```bash
rm -rf node_modules package-lock.json
npm install
```
(Windows: `Remove-Item -Recurse -Force node_modules, package-lock.json`)

### ❌ Gemini 호출 시 403/400
→ API 키 잘못 입력했거나 키에 권한 없음. Google AI Studio에서 새 키 발급 후 재시도.

### ❌ 한글 폴더명 문제 (Windows)
→ `사주 개발개발` 처럼 한글+공백 폴더명은 일부 도구에서 문제 일으킬 수 있음. 안전한 영문명(`saju-dev`)으로 바꾸는 것 권장.

---

## 🔄 운영 사이트(paljawon.com)에 적용할 때

이 프로젝트는 **프로토타입**입니다. 운영 사이트에 옮기실 때 주의:

1. **`lib/` 의 모든 파일을 그대로 복사** 가능 — 외부 의존성 없음
2. **`app/api/` 의 라우트** 는 운영 사이트의 라우팅 구조에 맞춰 조정 필요
3. **`app/page.tsx` 의 컴포넌트** 들은 운영 사이트의 디자인 시스템에 맞춰 스타일 수정
4. **`globals.css` 의 스타일** 은 운영 사이트의 다크 테마 변수와 매핑
5. **AI 프롬프트** 는 [`app/api/compatibility/route.ts`](../app/api/compatibility/route.ts) 의 `buildCompatPrompt` 함수가 핵심. 운영 코드에 통째로 옮기면 됨.

---

## 📞 문제 발생 시

1. 콘솔 에러 메시지 확인 (`npm run dev` 터미널 + 브라우저 개발자 도구)
2. [`docs/STRUCTURE.md`](./STRUCTURE.md) 에서 어느 파일이 어떤 역할인지 확인
3. [`docs/DECISIONS.md`](./DECISIONS.md) 에서 왜 그렇게 설계됐는지 맥락 확인

---

**테스트 환경**: Windows 11 + Node 20 + npm 11
**작업 디렉토리**: `C:\Users\PC\Desktop\사주 개발개발`
