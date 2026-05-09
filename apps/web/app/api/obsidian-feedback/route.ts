import { access, appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_VAULT_ROOT = '/Users/im_1699/Documents/obsidian_vault';
const FEEDBACK_KINDS = new Set([
  'classification_wrong',
  'revert_to_triage',
  'drop_task',
  'owner_wrong',
  'priority_wrong',
  'blocked_wrong',
  'other'
]);
const FEEDBACK_TIERS = new Set(['public', 'internal', 'sensitive', 'exec']);

type FeedbackBody = {
  kind?: string;
  tier?: string;
  note?: string;
  language?: string;
  work?: {
    id?: string;
    title?: string;
    stage?: string;
    owner?: string;
    previousOwner?: string;
    nextOwner?: string;
    priority?: string;
    due?: string;
    team?: string;
    sourceId?: string;
    evidence?: string[];
  };
};

function localTimestamp() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}:${value('second')}`
  };
}

function clip(value: unknown, limit = 1200) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, limit);
}

function listValue(values?: string[]) {
  const clean = (values ?? []).map((value) => clip(value, 220)).filter(Boolean);
  return clean.length > 0 ? clean.map((value) => `  - ${value}`).join('\n') : '  - 없음';
}

function isLocalRequest(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const origin = request.headers.get('origin') ?? '';
  const localHost = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host);
  const localOrigin = !origin || /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin);
  return localHost && localOrigin;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: 'Localhost requests only.' }, { status: 403 });
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const kind = clip(body.kind, 80);
  const tier = FEEDBACK_TIERS.has(clip(body.tier, 40)) ? clip(body.tier, 40) : 'internal';
  const workId = clip(body.work?.id, 80);
  const note = clip(body.note, 4000);

  if (!FEEDBACK_KINDS.has(kind) || !workId || !note) {
    return NextResponse.json({ error: 'Feedback kind, work id, and note are required.' }, { status: 400 });
  }

  const vaultRoot = process.env.OBSIDIAN_VAULT_ROOT ?? DEFAULT_VAULT_ROOT;
  const inboxDir = path.resolve(vaultRoot, '00_Inbox');
  const { date, time } = localTimestamp();
  const targetFile = path.resolve(inboxDir, `${date} ${tier} workflow-card-feedback.md`);

  if (!targetFile.startsWith(`${inboxDir}${path.sep}`)) {
    return NextResponse.json({ error: 'Invalid inbox path.' }, { status: 400 });
  }

  await mkdir(inboxDir, { recursive: true });
  const exists = await fileExists(targetFile);
  const header = exists
    ? ''
    : `---\ntype: raw_event\nsource: local_dashboard\ncaptured_at: ${date}\ndetected_signals: [dashboard_feedback]\nprocessed: false\ntier: ${tier}\n---\n\n# 업무카드 피드백 ${date} (${tier})\n\n> Local Dashboard에서 카드 단위 정정 요청이 들어온 raw Inbox입니다. 처리 후 Decisions/액션 보드나 관련 People/Concepts 노트에 반영합니다.\n\n`;

  const work = body.work ?? {};
  const entry = `## ${date} ${time} — ${workId} ${clip(work.title, 160)}\n\n- feedback_type: ${kind}\n- tier: ${tier}\n- language: ${clip(body.language, 20) || 'ko'}\n- current_stage: ${clip(work.stage, 80) || '-'}\n- current_owner: ${clip(work.owner, 80) || '-'}\n- previous_owner: ${clip(work.previousOwner, 80) || '-'}\n- next_owner: ${clip(work.nextOwner, 80) || '-'}\n- priority: ${clip(work.priority, 80) || '-'}\n- due: ${clip(work.due, 160) || '-'}\n- team: ${clip(work.team, 120) || '-'}\n- source_id: ${clip(work.sourceId, 120) || '-'}\n- evidence:\n${listValue(work.evidence)}\n\n### 사용자 피드백\n${note}\n\n### 처리 규칙\n- [ ] raw 피드백을 확인하고 기존 액션 보드 카드의 메타를 수정한다.\n- [ ] 분류 오류면 상태/담당/긴급도/근거를 바로잡는다.\n- [ ] 되돌림 요청이면 진행 로그를 지우지 말고 ↳ 시점 누적으로 상태를 되돌린다.\n- [ ] 드랍 요청이면 완료가 아니라 dropped/보류/외부이슈 중 하나로 사유를 남긴다.\n\n`;

  await appendFile(targetFile, `${header}${entry}`, 'utf8');

  return NextResponse.json({ ok: true, inboxPath: targetFile });
}
