# ima2 Math Converter

## 수학 러시 배틀 프로토타입

전자칠판용 러너 슈터형 수학 게임 프로토타입입니다.

- Local: `http://127.0.0.1:3014/math-rush-battle`
- Production: `https://math-rush-battle.vercel.app/math-rush-battle`
- App route: `apps/web/app/math-rush-battle`
- Game assets: `apps/web/public/math-rush-battle-v2`
- Background generator: `tools/generate_math_rush_road_bg.py`
- Static Vercel export helper: `tools/export_vercel_static_output.py`

```bash
npm install
npm run build -w web
npm run start -w web -- -p 3014
```

배경 도로(`road-bg-v3.png`)는 게임의 `roadPerspective` 좌표와 같은 원근선을 사용하도록 생성되어,
악당 이동, 아이템, 직선 총알 궤적이 배경 도로와 같은 소실점으로 맞춰집니다.

---

수학 문제 이미지를 업로드하거나 클립보드에서 붙여넣고, GPT 모델로 문항 OCR과
수식 LaTeX 변환, 도형/그래프의 GeoGebra `.ggb` 파일 생성을 수행하는 로컬 웹앱입니다.

- Frontend: Next.js (`apps/web`)
- Backend: Express + TypeScript (`apps/server`)
- Auth: `@openai/codex` 로그인 + `openai-oauth` 로컬 프록시 또는 `OPENAI_API_KEY`

## 실행 방법

1. Node.js 22+ 설치
2. 루트에서 의존성 설치

```bash
npm install
```

3. OAuth 로그인

```bash
npm run setup
```

`2. ChatGPT OAuth 로그인`을 선택하면 내부적으로 `npx @openai/codex login`을 실행합니다.
로그인 파일은 `~/.codex/auth.json` 또는 `~/.chatgpt-local/auth.json`에 저장되며, 앱은
토큰을 직접 읽지 않고 파일 존재 여부만 확인합니다.

4. 개발 서버 실행

```bash
npm run dev
```

- Web: `http://localhost:3012`
- API: `http://localhost:4000`
- OAuth proxy: `http://127.0.0.1:10531`
- 기본 변환 모델: `gpt-5.5` (`MATH_CONVERSION_MODEL` 또는 화면의 모델 입력으로 변경 가능)

서버는 `OPENAI_API_KEY`가 없거나 `OPENAI_PROVIDER=oauth`이면
`npx openai-oauth --port 10531`을 자동으로 실행하고, 종료되면 5초 뒤 재시작합니다.

## 변환 API

- `GET /api/oauth/status`
- `POST /api/math/convert`

요청 예시:

```json
{
  "provider": "oauth",
  "image": {
    "dataUrl": "data:image/png;base64,...",
    "name": "problem.png",
    "mimeType": "image/png"
  }
}
```

응답에는 OCR Markdown, 수식 목록, GeoGebra 명령 목록, 다운로드 가능한 `.ggb` base64가
포함됩니다.

## 기존 스킬 데모 API

- `web-search`: 웹 검색
- `weather`: 날씨 조회
- `calculator`: 계산기
- `summarizer`: 텍스트 요약
- `translator`: 번역
- `news-brief`: 기술 뉴스 브리핑
- `reminder`: 리마인더 저장/조회
- `code-assistant`: 코드 작업 계획 생성

모든 스킬은 실제 폴더 + `SKILL.md` 문서 규격으로 등록되어 있습니다.

## 프로젝트 구조

```text
apps/
  web/      # Next.js UI
  server/   # Express API + Assistant engine
skills/     # SKILL.md 기반 스킬 저장소
```

- `GET /api/health`
- `GET /api/skills`
- `GET /api/skills/:skillId`
- `POST /api/assistant/execute`

요청 예시:

```json
{
  "instruction": "오늘 뉴욕 날씨 알려줘"
}
```

## 스킬 라우팅 방식

1. 명시적 스킬 호출: `/weather 서울 날씨`
2. `OPENAI_API_KEY`가 있으면 LLM 라우터 우선 사용
3. 없으면 키워드 기반 룰 라우팅 사용

## SKILL.md 규격

각 스킬은 아래 구조를 따릅니다.

```text
skills/<skill-id>/
  SKILL.md                 # name/description + 상세 지침
  scripts/                 # 실행 코드
  references/              # 참고 문서
  assets/                  # 템플릿 파일
  agents/openai.yaml       # UI 메타데이터
```

## OpenClaw 원본

- Repository: https://github.com/openclaw/openclaw
- Docs: https://docs.openclaw.ai
- 로컬 레퍼런스: `reference/openclaw` (shallow clone)
