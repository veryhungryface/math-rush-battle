'use client';

import compactData from './obsidian-workflow-compact.json';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  DatabaseZap,
  GitBranch,
  Lock,
  Menu,
  MessageSquareWarning,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  UsersRound,
  Workflow,
  X
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { ElementType } from 'react';

type Lang = 'ko' | 'en';
type LocalText = Record<Lang, string>;
type Stage = 'raw' | 'triage' | 'doing' | 'review' | 'handoff' | 'blocked' | 'done';
type Priority = 'critical' | 'high' | 'medium';
type ModuleId = 'flow' | 'blocked' | 'detail' | 'audit' | 'feed';
type FeedbackKind = 'classification_wrong' | 'revert_to_triage' | 'drop_task' | 'owner_wrong' | 'priority_wrong' | 'blocked_wrong' | 'other';
type FeedbackTier = 'public' | 'internal' | 'sensitive' | 'exec';
type Tier = FeedbackTier;

type RawEvent = {
  id: string;
  source: string;
  receivedAt: string;
  rawText: LocalText;
  signal: LocalText;
  normalizedTaskId: string;
};

type WorkItem = {
  id: string;
  sourceId: string;
  title: LocalText;
  rawSummary: LocalText;
  owner: string;
  previousOwner?: string;
  nextOwner?: string;
  team: string;
  stage: Stage;
  priority: Priority;
  ageHours: number;
  due: LocalText;
  updatedAt: string;
  blocker?: LocalText;
  handoffNote?: LocalText;
  evidence: string[];
  tier?: Tier;
  boardSource?: string;
};

type Member = {
  name: string;
  role: LocalText;
  team: string;
  capacity: number;
};

type ActivityEvent = {
  id: string;
  time: string;
  title: LocalText;
  detail: LocalText;
  kind: 'raw' | 'assign' | 'handoff' | 'blocked' | 'done';
};

const text = (ko: string, en: string): LocalText => ({ ko, en });
const local = (value: LocalText, lang: Lang) => value[lang];

const copy = {
  ko: {
    appName: 'issamGPT Flow OS',
    nav: {
      flow: '업무 흐름',
      blocked: '정체',
      detail: '상세',
      audit: '로그',
      feed: 'Raw'
    },
    liveOn: '실시간 수집',
    liveOff: '수집 일시정지',
    reset: '리셋',
    createAction: '업무 추가',
    search: '검색',
    closeSearch: '검색 닫기',
    menu: '메뉴',
    sections: {
      feed: '• RAW DATA INTAKE',
      feedTitle: '들어온 원본 신호',
      flow: '• TEAM WORKFLOW',
      flowTitle: '정리된 업무 흐름',
      people: '• PERSON VIEW',
      peopleTitle: '팀 내부 인원별 현재 상태',
      blocked: '• BOTTLENECK RADAR',
      blockedTitle: '어디서 막혔는지',
      detail: '• SELECTED WORK',
      detailTitle: '업무 상세',
      audit: '• AUDIT STREAM',
      auditTitle: '처리/인계 로그'
    },
    searchPlaceholder: '업무, 원본, 담당자 검색',
    all: '전체',
    next: '처리',
    handoff: '인계',
    unblock: '정체 해소',
    markBlocked: '정체 표시',
    viewWork: '업무 보기',
    source: '원천',
    owner: '현재 담당',
    previous: '이전 담당',
    nextOwner: '다음 담당',
    due: '마감',
    age: '경과',
    evidence: '근거',
    noTask: '선택된 업무가 없습니다.',
    synced: '수집 상태 변경',
    taskCreated: '업무가 추가됨',
    personalOpen: '퍼스널 뷰 열기',
    personalClose: '퍼스널 뷰 닫기',
    feedback: '피드백',
    feedbackPending: '정정 대기',
    feedbackTitle: '카드 피드백',
    feedbackSubtitle: '대시보드 판단이 틀렸다면 raw 정정 요청으로 Inbox에 남깁니다.',
    feedbackType: '정정 유형',
    feedbackTier: '보안 티어',
    feedbackNote: '정정 메모',
    feedbackPlaceholder: '예: 진행 중이 아니라 정리 전 상태로 되돌려야 함. 김현석 담당이 아니라 여승환 확인 후 재배정 필요.',
    feedbackSubmit: 'Inbox에 남기기',
    feedbackCancel: '닫기',
    feedbackQueued: '00_Inbox에 피드백을 남겼습니다.',
    feedbackFailed: '피드백 저장 실패',
    feedbackRequired: '정정 메모를 입력해 주세요.',
    feedbackInboxTarget: '저장 위치: Obsidian 00_Inbox'
  },
  en: {
    appName: 'issamGPT Flow OS',
    nav: {
      flow: 'Workflow',
      blocked: 'Blocked',
      detail: 'Detail',
      audit: 'Log',
      feed: 'Raw'
    },
    liveOn: 'Live intake',
    liveOff: 'Intake paused',
    reset: 'Reset',
    createAction: 'Add work',
    search: 'Search',
    closeSearch: 'Close search',
    menu: 'Menu',
    sections: {
      feed: '• RAW DATA INTAKE',
      feedTitle: 'Incoming source signals',
      flow: '• TEAM WORKFLOW',
      flowTitle: 'Normalized work flow',
      people: '• PERSON VIEW',
      peopleTitle: 'Current state by team member',
      blocked: '• BOTTLENECK RADAR',
      blockedTitle: 'Where work is stuck',
      detail: '• SELECTED WORK',
      detailTitle: 'Work detail',
      audit: '• AUDIT STREAM',
      auditTitle: 'Process and handoff log'
    },
    searchPlaceholder: 'Search task, source, owner',
    all: 'All',
    next: 'Process',
    handoff: 'Handoff',
    unblock: 'Unblock',
    markBlocked: 'Mark blocked',
    viewWork: 'View work',
    source: 'Source',
    owner: 'Current owner',
    previous: 'Previous',
    nextOwner: 'Next owner',
    due: 'Due',
    age: 'Age',
    evidence: 'Evidence',
    noTask: 'No work item selected.',
    synced: 'Intake state changed',
    taskCreated: 'Work item created',
    personalOpen: 'Open personal view',
    personalClose: 'Close personal view',
    feedback: 'Feedback',
    feedbackPending: 'Pending correction',
    feedbackTitle: 'Card feedback',
    feedbackSubtitle: 'If the dashboard judgment is wrong, queue a raw correction request into Inbox.',
    feedbackType: 'Correction type',
    feedbackTier: 'Security tier',
    feedbackNote: 'Correction note',
    feedbackPlaceholder: 'Example: this should be reverted to triage. Owner should be reassigned after Yeo confirms.',
    feedbackSubmit: 'Send to Inbox',
    feedbackCancel: 'Close',
    feedbackQueued: 'Feedback saved to 00_Inbox.',
    feedbackFailed: 'Feedback save failed',
    feedbackRequired: 'Please enter a correction note.',
    feedbackInboxTarget: 'Target: Obsidian 00_Inbox'
  }
} satisfies Record<Lang, object>;

const stageLabels: Record<Lang, Record<Stage, string>> = {
  ko: {
    raw: '접수',
    triage: '정리됨',
    doing: '진행',
    review: '검토',
    handoff: '인계',
    blocked: '정체',
    done: '완료'
  },
  en: {
    raw: 'Raw',
    triage: 'Triaged',
    doing: 'Doing',
    review: 'Review',
    handoff: 'Handoff',
    blocked: 'Blocked',
    done: 'Done'
  }
};

const priorityLabels: Record<Lang, Record<Priority, string>> = {
  ko: {
    critical: '긴급',
    high: '높음',
    medium: '보통'
  },
  en: {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium'
  }
};

const visibleStages: Stage[] = ['triage', 'doing', 'review', 'handoff', 'blocked', 'done'];
const nextStage: Record<Stage, Stage> = {
  raw: 'triage',
  triage: 'doing',
  doing: 'review',
  review: 'handoff',
  handoff: 'done',
  blocked: 'doing',
  done: 'done'
};

const modules: Array<{ id: ModuleId; icon: ElementType }> = [
  { id: 'flow', icon: Workflow },
  { id: 'blocked', icon: AlertTriangle },
  { id: 'detail', icon: CircleDot },
  { id: 'audit', icon: Sparkles },
  { id: 'feed', icon: DatabaseZap }
];

const feedbackOptions: Record<Lang, Array<{ id: FeedbackKind; label: string; helper: string }>> = {
  ko: [
    { id: 'classification_wrong', label: '분류 오류', helper: '업무, 상태, 팀, 근거가 잘못 잡힘' },
    { id: 'revert_to_triage', label: '진행 전으로 되돌림', helper: '진행 중/검토 상태가 너무 앞서감' },
    { id: 'drop_task', label: '드랍/보류', helper: '다른 이슈 때문에 더 이상 진행하지 않음' },
    { id: 'owner_wrong', label: '담당자 수정', helper: 'owner, accountable, waiting_on 재정리 필요' },
    { id: 'priority_wrong', label: '긴급도/기한 수정', helper: '대표/실장 지시, 마감, 우선순위 보정' },
    { id: 'blocked_wrong', label: '정체 사유 수정', helper: '막힌 이유나 병목 주체가 다름' },
    { id: 'other', label: '기타 정정', helper: '추가 설명이 필요한 예외 케이스' }
  ],
  en: [
    { id: 'classification_wrong', label: 'Wrong classification', helper: 'Work, status, team, or evidence is wrong' },
    { id: 'revert_to_triage', label: 'Revert to triage', helper: 'Doing/review state moved too far' },
    { id: 'drop_task', label: 'Drop or park', helper: 'No longer active because another issue took over' },
    { id: 'owner_wrong', label: 'Owner correction', helper: 'Owner, accountable, or waiting_on needs revision' },
    { id: 'priority_wrong', label: 'Priority or due', helper: 'Urgency, deadline, or executive signal needs correction' },
    { id: 'blocked_wrong', label: 'Blocker correction', helper: 'The bottleneck reason or person is wrong' },
    { id: 'other', label: 'Other correction', helper: 'Exception case needing more explanation' }
  ]
};

const feedbackTierOptions: Record<Lang, Array<{ id: FeedbackTier; label: string }>> = {
  ko: [
    { id: 'internal', label: '일반 내부' },
    { id: 'sensitive', label: '민감' },
    { id: 'exec', label: '임원/보안' },
    { id: 'public', label: '공유 가능' }
  ],
  en: [
    { id: 'internal', label: 'Internal' },
    { id: 'sensitive', label: 'Sensitive' },
    { id: 'exec', label: 'Exec' },
    { id: 'public', label: 'Public' }
  ]
};

const teamOrder = ['AI서비스실', '전략기획팀', '수학서비스팀'] as const;
const teamLabels: Record<Lang, Record<(typeof teamOrder)[number], string>> = {
  ko: {
    AI서비스실: 'AI서비스실',
    전략기획팀: '전략기획팀',
    수학서비스팀: '수학서비스팀'
  },
  en: {
    AI서비스실: 'AI Service',
    전략기획팀: 'Strategy Planning',
    수학서비스팀: 'Math Service'
  }
};

const rawEvents = compactData.rawEvents as RawEvent[];
const members = compactData.members as Member[];
const initialWorkItems = compactData.workItems as WorkItem[];
const initialActivity = compactData.activity as ActivityEvent[];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function HomePage() {
  const [language, setLanguage] = useState<Lang>('ko');
  const [activeModule, setActiveModule] = useState<ModuleId>('flow');
  const [workItems, setWorkItems] = useState(initialWorkItems);
  const [activity, setActivity] = useState(initialActivity);
  const [selectedWorkId, setSelectedWorkId] = useState('U2');
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('전체');
  const [selectedMember, setSelectedMember] = useState<string>('전체');
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [isLive, setIsLive] = useState(true);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackWork, setFeedbackWork] = useState<WorkItem | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>('classification_wrong');
  const [feedbackTier, setFeedbackTier] = useState<FeedbackTier>('internal');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<LocalText | null>(null);
  const [feedbackLedger, setFeedbackLedger] = useState<Record<string, number>>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const c = copy[language];
  const selectedWork = workItems.find((item) => item.id === selectedWorkId) ?? workItems[0];
  const memberTeamByName = useMemo(() => new Map(members.map((member) => [member.name, member.team])), []);
  const memberGroups = useMemo(
    () =>
      teamOrder
        .map((team) => ({
          team,
          members: members.filter((member) => member.team === team)
        }))
        .filter((group) => selectedTeam === '전체' || group.team === selectedTeam),
    [selectedTeam]
  );

  const addActivity = (event: Omit<ActivityEvent, 'id' | 'time'>) => {
    const now = new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());

    setActivity((current) => [{ ...event, id: `A-${Date.now()}`, time: now }, ...current.slice(0, 7)]);
  };

  const visibleWorkItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return workItems.filter((item) => {
      const raw = rawEvents.find((event) => event.normalizedTaskId === item.id);
      const haystack = [
        item.id,
        item.title.ko,
        item.title.en,
        item.owner,
        item.previousOwner,
        item.nextOwner,
        item.team,
        raw?.source,
        raw?.rawText.ko,
        raw?.rawText.en
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      const matchesMember = selectedMember === '전체' || item.owner === selectedMember || item.previousOwner === selectedMember || item.nextOwner === selectedMember;
      const matchesTeam =
        selectedTeam === '전체' ||
        item.team === selectedTeam ||
        [item.owner, item.previousOwner, item.nextOwner].some((name) => name && memberTeamByName.get(name) === selectedTeam);
      return matchesQuery && matchesPriority && matchesMember && matchesTeam;
    });
  }, [memberTeamByName, priorityFilter, query, selectedMember, selectedTeam, workItems]);

  const blockedItems = workItems.filter((item) => item.stage === 'blocked' || item.ageHours >= 24);
  const activeItems = workItems.filter((item) => !['done', 'blocked'].includes(item.stage));
  const handoffItems = workItems.filter((item) => item.stage === 'handoff' || item.previousOwner);

  const selectModule = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
    setMenuOpen(false);
    if (moduleId === 'blocked' && blockedItems[0]) {
      setSelectedWorkId(blockedItems[0].id);
    }
  };

  const selectTeam = (team: string) => {
    setSelectedTeam(team);
    setSelectedMember('전체');
  };

  const openFeedback = (item: WorkItem, kind: FeedbackKind = 'classification_wrong') => {
    setSelectedWorkId(item.id);
    setFeedbackWork(item);
    setFeedbackKind(kind);
    setFeedbackTier('internal');
    setFeedbackNote('');
    setFeedbackMessage(null);
  };

  const closeFeedback = () => {
    if (feedbackSaving) {
      return;
    }
    setFeedbackWork(null);
    setFeedbackMessage(null);
  };

  const submitFeedback = async () => {
    if (!feedbackWork) {
      return;
    }

    const note = feedbackNote.trim();
    if (!note) {
      setFeedbackMessage(text(copy.ko.feedbackRequired, copy.en.feedbackRequired));
      return;
    }

    setFeedbackSaving(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch('/api/obsidian-feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: feedbackKind,
          tier: feedbackTier,
          note,
          language,
          work: {
            id: feedbackWork.id,
            title: feedbackWork.title.ko,
            stage: feedbackWork.stage,
            owner: feedbackWork.owner,
            previousOwner: feedbackWork.previousOwner,
            nextOwner: feedbackWork.nextOwner,
            priority: feedbackWork.priority,
            due: feedbackWork.due.ko,
            team: feedbackWork.team,
            sourceId: feedbackWork.sourceId,
            evidence: feedbackWork.evidence
          }
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const selectedOption = feedbackOptions[language].find((option) => option.id === feedbackKind);
      setFeedbackLedger((current) => ({ ...current, [feedbackWork.id]: (current[feedbackWork.id] ?? 0) + 1 }));
      setFeedbackNote('');
      setFeedbackMessage(null);
      addActivity({
        title: text('카드 피드백 접수', 'Card feedback queued'),
        detail: text(`${feedbackWork.id}: ${selectedOption?.label ?? feedbackKind} → 00_Inbox`, `${feedbackWork.id}: ${selectedOption?.label ?? feedbackKind} → 00_Inbox`),
        kind: 'raw'
      });
      setFeedbackWork(null);
    } catch {
      setFeedbackMessage(text(copy.ko.feedbackFailed, copy.en.feedbackFailed));
    } finally {
      setFeedbackSaving(false);
    }
  };

  const toggleSearch = () => {
    setActiveModule('flow');
    setSearchExpanded((current) => !current);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const toggleLive = () => {
    setIsLive((current) => !current);
    addActivity({
      title: text(copy.ko.synced, copy.en.synced),
      detail: text(
        isLive ? 'raw 데이터 수집을 일시정지했습니다.' : 'raw 데이터 수집을 다시 시작했습니다.',
        isLive ? 'Raw intake has been paused.' : 'Raw intake has resumed.'
      ),
      kind: 'raw'
    });
  };

  const createWork = () => {
    const id = `MANUAL-${String(workItems.length + 1).padStart(2, '0')}`;
    const nextTask: WorkItem = {
      id,
      sourceId: 'MANUAL',
      title: text('운영 회의 신규 업무 정리', 'Normalize new work from operating meeting'),
      rawSummary: text('회의 중 수동으로 추가된 업무를 담당자와 다음 인계자로 정리', 'Normalize a manually added meeting item with owner and next handoff'),
      owner: '배태영',
      nextOwner: '여승환',
      team: 'AI서비스실',
      stage: 'triage',
      priority: 'medium',
      ageHours: 0,
      due: text('오늘 운영 회의 후', 'After today\'s operating meeting'),
      updatedAt: new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
      evidence: ['manual compact entry']
    };
    setWorkItems((current) => [nextTask, ...current]);
    setSelectedWorkId(id);
    addActivity({
      title: text(copy.ko.taskCreated, copy.en.taskCreated),
      detail: text(`${id}가 triage 단계에 추가됨`, `${id} added to triage`),
      kind: 'assign'
    });
  };

  const processWork = (workId: string) => {
    const item = workItems.find((work) => work.id === workId);
    if (!item) {
      return;
    }

    const next = nextStage[item.stage];
    setWorkItems((current) =>
      current.map((work) => {
        if (work.id !== workId) {
          return work;
        }

        if (next === 'handoff' && work.nextOwner) {
          return {
            ...work,
            previousOwner: work.owner,
            owner: work.nextOwner,
            stage: next,
            ageHours: 0,
            updatedAt: timestamp(),
            handoffNote: text(`${work.previousOwner ?? work.owner} → ${work.nextOwner} 인계됨`, `${work.previousOwner ?? work.owner} → ${work.nextOwner} handed off`)
          };
        }

        if (work.stage === 'blocked') {
          return {
            ...work,
            stage: 'doing',
            ageHours: 0,
            updatedAt: timestamp(),
            blocker: undefined
          };
        }

        return {
          ...work,
          stage: next,
          ageHours: next === 'done' ? 0 : work.ageHours,
          updatedAt: timestamp()
        };
      })
    );

    addActivity({
      title: next === 'handoff' ? text('업무 인계', 'Work handed off') : text('업무 처리', 'Work processed'),
      detail:
        next === 'handoff' && item.nextOwner
          ? text(`${item.id}: ${item.owner} → ${item.nextOwner}`, `${item.id}: ${item.owner} → ${item.nextOwner}`)
          : text(`${item.id}가 ${stageLabels.ko[next]} 단계로 이동`, `${item.id} moved to ${stageLabels.en[next]}`),
      kind: next === 'done' ? 'done' : next === 'handoff' ? 'handoff' : 'assign'
    });
  };

  const markBlocked = (workId: string) => {
    const item = workItems.find((work) => work.id === workId);
    if (!item) {
      return;
    }
    setWorkItems((current) =>
      current.map((work) =>
        work.id === workId
          ? {
              ...work,
              stage: 'blocked',
              ageHours: Math.max(work.ageHours, 24),
              updatedAt: timestamp(),
              blocker: text('담당자 응답 또는 원천 데이터 확인이 지연됨', 'Owner response or source data confirmation is delayed')
            }
          : work
      )
    );
    addActivity({
      title: text('정체 표시', 'Marked blocked'),
      detail: text(`${item.id}가 정체 업무로 표시됨`, `${item.id} marked as blocked`),
      kind: 'blocked'
    });
  };

  const resetScenario = () => {
    setWorkItems(initialWorkItems);
    setActivity(initialActivity);
    setSelectedWorkId('U2');
    setSelectedTeam('전체');
    setSelectedMember('전체');
    setQuery('');
    setPriorityFilter('all');
    setIsLive(true);
    setSearchExpanded(false);
    setPeopleOpen(false);
    setMenuOpen(false);
    setFeedbackWork(null);
    setFeedbackLedger({});
    setActiveModule('flow');
  };

  return (
    <main className="appShell">
      <header className="floatingNav">
        <button className="brandPill" type="button" onClick={() => selectModule('flow')} aria-label={c.appName}>
          <span className="brandCircles" aria-hidden="true">
            <i />
            <b />
          </span>
          <strong>{c.appName}</strong>
        </button>

        <nav className={cn('navLinks', menuOpen && 'open')} aria-label="Primary">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button className={cn('navLink', activeModule === module.id && 'active')} key={module.id} type="button" onClick={() => selectModule(module.id)}>
                <Icon size={17} />
                <span>{c.nav[module.id]}</span>
              </button>
            );
          })}
        </nav>

        <div className="navTools">
          <button className={cn('circleTool', !isLive && 'paused')} type="button" onClick={toggleLive} aria-label={isLive ? c.liveOff : c.liveOn} title={isLive ? c.liveOff : c.liveOn}>
            {isLive ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="circleTool" type="button" onClick={resetScenario} aria-label={c.reset} title={c.reset}>
            <RefreshCw size={18} />
          </button>
          <button className="circleTool primaryTool" type="button" onClick={createWork} aria-label={c.createAction} title={c.createAction}>
            <Plus size={18} />
          </button>
          <button className="circleTool desktopOnly" type="button" onClick={toggleSearch} aria-label={searchExpanded ? c.closeSearch : c.search} title={searchExpanded ? c.closeSearch : c.search}>
            {searchExpanded ? <X size={18} /> : <Search size={18} />}
          </button>
          <div className="languageToggle" aria-label="language">
            <button className={language === 'ko' ? 'active' : ''} type="button" onClick={() => setLanguage('ko')}>
              KR
            </button>
            <button className={language === 'en' ? 'active' : ''} type="button" onClick={() => setLanguage('en')}>
              EN
            </button>
          </div>
          <button className="circleTool mobileOnly" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label={c.menu}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <section className="workspaceFrame">
        <section className={cn('opsGrid', peopleOpen && 'peopleOpen', activeModule === 'feed' && 'rawMode')}>
          <aside className={cn('peopleDock', peopleOpen && 'open')} id="people">
            {peopleOpen ? (
              <section className="peoplePanel">
                <div className="panelHeader">
                  <div>
                    <p className="sectionKicker">{c.sections.people}</p>
                    <h2>{c.sections.peopleTitle}</h2>
                  </div>
                  <button className="circleTool miniTool" type="button" onClick={() => setPeopleOpen(false)} aria-label={c.personalClose} title={c.personalClose}>
                    <X size={16} />
                  </button>
                </div>
                <div className="teamSwitch" aria-label="team filter">
                  <button className={selectedTeam === '전체' ? 'active' : ''} type="button" onClick={() => selectTeam('전체')}>
                    {c.all}
                  </button>
                  {teamOrder.map((team) => (
                    <button className={selectedTeam === team ? 'active' : ''} key={team} type="button" onClick={() => selectTeam(team)}>
                      {teamLabels[language][team]}
                    </button>
                  ))}
                </div>
                <div className="memberGroups">
                  {memberGroups.map((group) => (
                    <section className="memberGroup" key={group.team}>
                      <header>
                        <span>{teamLabels[language][group.team]}</span>
                        <b>{group.members.length}</b>
                      </header>
                      <div className="memberList">
                        {group.members.map((member) => {
                          const owned = workItems.filter((item) => item.owner === member.name && item.stage !== 'done');
                          const handedTo = workItems.filter((item) => item.nextOwner === member.name && item.stage === 'handoff');
                          const blocked = owned.filter((item) => item.stage === 'blocked');
                          return (
                            <button className={cn('memberCard', selectedMember === member.name && 'active')} key={member.name} type="button" onClick={() => setSelectedMember(member.name)}>
                              <span>
                                <strong>
                                  <i>{local(member.role, language)}</i>
                                  {member.name}
                                </strong>
                                <small>{teamLabels[language][group.team]}</small>
                              </span>
                              <b>{owned.length}/{member.capacity}</b>
                              <em>
                                {language === 'ko' ? '받을 업무' : 'Incoming'} {handedTo.length} · {stageLabels[language].blocked} {blocked.length}
                              </em>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            ) : (
              <button className="peopleLauncher" type="button" onClick={() => setPeopleOpen(true)} aria-label={c.personalOpen} title={c.personalOpen}>
                <UsersRound size={18} />
                <span>{language === 'ko' ? '퍼스널 뷰' : 'Personal View'}</span>
              </button>
            )}
          </aside>

          {activeModule === 'feed' && (
            <section className="rawPanel rawWorkspace workspacePanel" id="feed">
              <PanelTitle kicker={c.sections.feed} title={c.sections.feedTitle} icon={DatabaseZap} />
              <div className="rawList">
                {rawEvents.map((event) => (
                  <button
                    className={cn('rawItem', selectedWorkId === event.normalizedTaskId && 'active')}
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkId(event.normalizedTaskId);
                      setActiveModule('detail');
                    }}
                  >
                    <span className="rawMeta">
                      <b>{event.source}</b>
                      <i>{event.receivedAt}</i>
                    </span>
                    <strong>{local(event.signal, language)}</strong>
                    <small>{local(event.rawText, language)}</small>
                    <em>
                      {event.id} → {event.normalizedTaskId}
                    </em>
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeModule === 'flow' && (
            <section className="flowPanel workspacePanel" id="flow">
              <div className="flowHeader">
                <PanelTitle kicker={c.sections.flow} title={c.sections.flowTitle} icon={Workflow} />
                <div className={cn('queueControls', searchExpanded && 'isExpanded')}>
                  <label className="searchBox">
                    <Search size={15} />
                    <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.searchPlaceholder} />
                  </label>
                  <div className="segmentedControl" aria-label="priority filter">
                    {(['all', 'critical', 'high', 'medium'] as const).map((filter) => (
                      <button key={filter} type="button" className={priorityFilter === filter ? 'active' : ''} onClick={() => setPriorityFilter(filter)}>
                        {filter === 'all' ? c.all : priorityLabels[language][filter]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="kanbanBoard">
                {visibleStages.map((stage) => {
                  const stageItems = visibleWorkItems.filter((item) => item.stage === stage);
                  return (
                    <section className={cn('stageColumn', stage)} key={stage}>
                      <header>
                        <span>{stageLabels[language][stage]}</span>
                        <b>{stageItems.length}</b>
                      </header>
                      <div className="stageCards">
                        {stageItems.map((item) => (
                          <WorkCard
                            c={c}
                            item={item}
                            key={item.id}
                            language={language}
                            selected={selectedWorkId === item.id}
                            feedbackCount={feedbackLedger[item.id] ?? 0}
                            onSelect={() => setSelectedWorkId(item.id)}
                            onNext={() => processWork(item.id)}
                            onBlock={() => markBlocked(item.id)}
                            onFeedback={() => openFeedback(item)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          )}

          {activeModule === 'blocked' && (
            <section className="blockedPanel workspacePanel" id="blocked">
              <PanelTitle kicker={c.sections.blocked} title={c.sections.blockedTitle} icon={AlertTriangle} />
              <div className="blockedList">
                {blockedItems.map((item) => (
                  <article className="blockedItem" key={item.id}>
                    <div>
                      <span>{item.id}</span>
                      <strong>{local(item.title, language)}</strong>
                      <small>{item.blocker ? local(item.blocker, language) : local(item.rawSummary, language)}</small>
                    </div>
                    <b>{item.ageHours}h</b>
                    <button type="button" onClick={() => processWork(item.id)}>
                      <CheckCircle2 size={15} />
                      {c.unblock}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeModule === 'detail' && (
            <section className="detailPanel workspacePanel">
              <PanelTitle kicker={c.sections.detail} title={c.sections.detailTitle} icon={CircleDot} />
              {selectedWork ? (
                <div className="detailCard">
                  <div className="detailTitle">
                    <span className={cn('priorityMark', selectedWork.priority)}>{priorityLabels[language][selectedWork.priority]}</span>
                    <h2>{local(selectedWork.title, language)}</h2>
                  </div>
                  <p>{local(selectedWork.rawSummary, language)}</p>
                  {(selectedWork.handoffNote || selectedWork.blocker) && (
                    <div className="decisionNotes">
                      {selectedWork.handoffNote && (
                        <p>
                          <GitBranch size={14} />
                          {local(selectedWork.handoffNote, language)}
                        </p>
                      )}
                      {selectedWork.blocker && (
                        <p className="isBlocked">
                          <AlertTriangle size={14} />
                          {local(selectedWork.blocker, language)}
                        </p>
                      )}
                    </div>
                  )}
                  <dl>
                    <div>
                      <dt>{c.source}</dt>
                      <dd>{selectedWork.sourceId}</dd>
                    </div>
                    <div>
                      <dt>{c.owner}</dt>
                      <dd>{selectedWork.owner}</dd>
                    </div>
                    <div>
                      <dt>{c.previous}</dt>
                      <dd>{selectedWork.previousOwner ?? '-'}</dd>
                    </div>
                    <div>
                      <dt>{c.nextOwner}</dt>
                      <dd>{selectedWork.nextOwner ?? '-'}</dd>
                    </div>
                    <div>
                      <dt>{c.due}</dt>
                      <dd>{local(selectedWork.due, language)}</dd>
                    </div>
                    <div>
                      <dt>{c.age}</dt>
                      <dd>{selectedWork.ageHours}h</dd>
                    </div>
                  </dl>
                  <div className="evidenceList">
                    <span>{c.evidence}</span>
                    {selectedWork.evidence.map((item) => (
                      <b key={item}>{item}</b>
                    ))}
                  </div>
	                  <div className="detailActions">
	                    <button type="button" onClick={() => processWork(selectedWork.id)}>
	                      <ArrowRight size={16} />
	                      {selectedWork.stage === 'review' ? c.handoff : selectedWork.stage === 'blocked' ? c.unblock : c.next}
	                    </button>
	                    <button type="button" onClick={() => markBlocked(selectedWork.id)}>
	                      <AlertTriangle size={16} />
	                      {c.markBlocked}
	                    </button>
	                    <button type="button" onClick={() => openFeedback(selectedWork)}>
	                      <MessageSquareWarning size={16} />
	                      {c.feedback}
	                    </button>
	                  </div>
                </div>
              ) : (
                <p>{c.noTask}</p>
              )}
            </section>
          )}

          {activeModule === 'audit' && (
            <section className="activityStream workspacePanel">
              <PanelTitle kicker={c.sections.audit} title={c.sections.auditTitle} icon={Sparkles} />
              <div className="activityList">
                {activity.map((event) => (
                  <article className={cn('activityItem', event.kind)} key={event.id}>
                    <span>{event.time}</span>
                    <div>
                      <strong>{local(event.title, language)}</strong>
                      <small>{local(event.detail, language)}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
	        </section>
	      </section>
	      {feedbackWork && (
	        <FeedbackDialog
	          c={c}
	          item={feedbackWork}
	          language={language}
	          kind={feedbackKind}
	          tier={feedbackTier}
	          note={feedbackNote}
	          saving={feedbackSaving}
	          message={feedbackMessage}
	          onKindChange={setFeedbackKind}
	          onTierChange={setFeedbackTier}
	          onNoteChange={setFeedbackNote}
	          onClose={closeFeedback}
	          onSubmit={submitFeedback}
	        />
	      )}
	    </main>
	  );
	}

function timestamp() {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

function PanelTitle({ kicker, title, icon: Icon }: { kicker: string; title: string; icon: ElementType }) {
  return (
    <div className="panelHeader">
      <div>
        <p className="sectionKicker">{kicker}</p>
        <h2>{title}</h2>
      </div>
      <Icon size={18} />
    </div>
  );
}

function WorkCard({
  c,
  item,
  language,
  selected,
  feedbackCount,
  onSelect,
  onNext,
  onBlock,
  onFeedback
}: {
  c: (typeof copy)['ko'];
  item: WorkItem;
  language: Lang;
  selected: boolean;
  feedbackCount: number;
  onSelect: () => void;
  onNext: () => void;
  onBlock: () => void;
  onFeedback: () => void;
}) {
  return (
    <article className={cn('workCard', item.stage, selected && 'selected', item.tier && `tier-${item.tier}`)}>
      <button className="workCardMain" type="button" onClick={onSelect}>
        <span className="workId">
          {item.id}
          {item.tier === 'exec' && (
            <Lock size={11} aria-label="exec" style={{ marginLeft: 4, color: '#c00', verticalAlign: 'middle' }} />
          )}
          {item.tier === 'sensitive' && (
            <Shield size={11} aria-label="sensitive" style={{ marginLeft: 4, color: '#d80', verticalAlign: 'middle' }} />
          )}
          {item.boardSource === 'math' && (
            <span style={{ marginLeft: 4, fontSize: 10, color: '#888' }}>📐</span>
          )}
        </span>
        <strong>{local(item.title, language)}</strong>
        <small>{local(item.rawSummary, language)}</small>
      </button>
      {feedbackCount > 0 && (
        <span className="feedbackBadge">
          <MessageSquareWarning size={12} />
          {c.feedbackPending} {feedbackCount}
        </span>
      )}
      <div className="handoffLine">
        <span>{item.previousOwner ?? item.sourceId}</span>
        <ArrowRight size={13} />
        <b>{item.owner}</b>
        {item.nextOwner && (
          <>
            <ArrowRight size={13} />
            <span>{item.nextOwner}</span>
          </>
        )}
      </div>
      <div className="workMeta">
        <span className={cn('priorityMark', item.priority)}>{priorityLabels[language][item.priority]}</span>
        <span>
          <Clock3 size={13} />
          {item.ageHours}h
        </span>
      </div>
      {item.blocker && <p className="blockerText">{local(item.blocker, language)}</p>}
      <div className="workActions">
        <button type="button" onClick={onNext}>
          <ArrowRight size={14} />
          {item.stage === 'review' ? c.handoff : item.stage === 'blocked' ? c.unblock : c.next}
        </button>
        {item.stage !== 'blocked' && item.stage !== 'done' && (
          <button type="button" onClick={onBlock}>
            <AlertTriangle size={14} />
            {c.markBlocked}
          </button>
        )}
        <button className="feedbackButton" type="button" onClick={onFeedback}>
          <MessageSquareWarning size={14} />
          {c.feedback}
        </button>
      </div>
    </article>
  );
}

function FeedbackDialog({
  c,
  item,
  language,
  kind,
  tier,
  note,
  saving,
  message,
  onKindChange,
  onTierChange,
  onNoteChange,
  onClose,
  onSubmit
}: {
  c: (typeof copy)['ko'];
  item: WorkItem;
  language: Lang;
  kind: FeedbackKind;
  tier: FeedbackTier;
  note: string;
  saving: boolean;
  message: LocalText | null;
  onKindChange: (kind: FeedbackKind) => void;
  onTierChange: (tier: FeedbackTier) => void;
  onNoteChange: (note: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const options = feedbackOptions[language];

  return (
    <div className="modalBackdrop" role="presentation">
      <section className="feedbackDialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <div className="feedbackHeader">
          <div>
            <p className="sectionKicker">• FEEDBACK LOOP</p>
            <h2 id="feedback-title">{c.feedbackTitle}</h2>
            <small>{c.feedbackSubtitle}</small>
          </div>
          <button className="circleTool miniTool" type="button" onClick={onClose} aria-label={c.feedbackCancel}>
            <X size={16} />
          </button>
        </div>

        <div className="feedbackWorkContext">
          <span>{item.id}</span>
          <strong>{local(item.title, language)}</strong>
          <small>
            {stageLabels[language][item.stage]} · {item.owner} · {priorityLabels[language][item.priority]}
          </small>
        </div>

        <div className="feedbackForm">
          <label>{c.feedbackType}</label>
          <div className="feedbackOptions">
            {options.map((option) => (
              <button className={kind === option.id ? 'active' : ''} key={option.id} type="button" onClick={() => onKindChange(option.id)}>
                <strong>{option.label}</strong>
                <small>{option.helper}</small>
              </button>
            ))}
          </div>

          <label>{c.feedbackTier}</label>
          <div className="feedbackTier">
            {feedbackTierOptions[language].map((option) => (
              <button className={tier === option.id ? 'active' : ''} key={option.id} type="button" onClick={() => onTierChange(option.id)}>
                {option.label}
              </button>
            ))}
          </div>

          <label htmlFor="feedback-note">{c.feedbackNote}</label>
          <textarea id="feedback-note" value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder={c.feedbackPlaceholder} rows={6} />
        </div>

        {message && <p className="feedbackNotice">{local(message, language)}</p>}

        <div className="feedbackFoot">
          <span>{c.feedbackInboxTarget}</span>
          <div>
            <button type="button" onClick={onClose} disabled={saving}>
              {c.feedbackCancel}
            </button>
            <button type="button" onClick={onSubmit} disabled={saving}>
              {saving ? '...' : c.feedbackSubmit}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
