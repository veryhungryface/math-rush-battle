'use client';

import {
  Play,
  RotateCcw,
  UsersRound
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  allCurriculumProblems,
  curriculumAreas,
  curriculumGrades,
  curriculumUnits,
  getProblemPool,
  type CurriculumAreaId,
  type Problem
} from './problemBank';
import styles from './math-rush-battle.module.css';

type PlayPhase = 'menu' | 'playing' | 'result';
type TeamColor = 'blue' | 'red' | 'green' | 'purple';
type RoundMode = 'targets' | 'boss';
type ScenePhase = 'loading' | 'running' | 'between' | 'finished';

type TeamStatus = {
  id: number;
  label: string;
  teamName: string;
  color: TeamColor;
  score: number;
  hp: number;
  maxHp: number;
  soldiers: number;
  combo: number;
  maxCombo: number;
  correct: number;
  attempts: number;
  lane: number;
  position: number;
  weaponLevel: number;
  shield: number;
  rapidUntil: number;
  spreadUntil: number;
  missileUntil: number;
  laserUntil: number;
  magnetPower: number;
};

type RoundInfo = {
  number: number;
  mode: RoundMode;
  problem: Problem;
  bossHp: number;
  bossMaxHp: number;
  message: string;
};

type GameSummary = {
  teams: TeamStatus[];
  winners: TeamStatus[];
  bossDefeated: boolean;
  totalRounds: number;
};

type GameApi = {
  moveTeam: (teamId: number, delta: -1 | 1) => void;
  setTeamPosition: (teamId: number, position: number) => void;
  setTeamDirection: (teamId: number, direction: -1 | 0 | 1) => void;
};

type PhaserSurfaceProps = {
  playerCount: number;
  problemPool: Problem[];
  runId: number;
  onApi: (api: GameApi | null) => void;
  onRound: (round: RoundInfo) => void;
  onStats: (teams: TeamStatus[]) => void;
  onFinish: (summary: GameSummary) => void;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ScenePointer = {
  x: number;
  y: number;
  id?: number;
  pointerId?: number;
  identifier?: number;
};

type SoldierView = {
  root: unknown;
};

type TargetView = {
  lane: number;
  position: number;
  choice: number;
  elite: boolean;
  hp: number;
  maxHp: number;
  correct: boolean;
  defeated: boolean;
  breached: boolean;
  root: unknown;
  choiceLabel: unknown;
  energyFill: unknown;
  baseY: number;
  swayAmplitude: number;
  swaySpeed: number;
  phase: number;
  speedMultiplier: number;
};

type BlockerView = {
  position: number;
  baseY: number;
  hp: number;
  maxHp: number;
  root: unknown;
  energyFill: unknown;
  defeated: boolean;
  breached: boolean;
  swayAmplitude: number;
  swaySpeed: number;
  phase: number;
  speedMultiplier: number;
};

type ProjectileView = {
  root: unknown;
  panelId: number;
  teamId: number;
  damage: number;
  position: number;
  speed: number;
  scaleBase: number;
  alive: boolean;
};

type PickupView = {
  position: number;
  kind: PickupKind;
  collected: boolean;
  root: unknown;
};

type PickupKind = 'rapid' | 'multi' | 'soldier' | 'shield' | 'rocket' | 'freeze' | 'heal' | 'magnet' | 'laser' | 'drone' | 'bomb' | 'overdrive';
type SpriteRef = { texture: string; frame: number };
type EnemySpriteRef = SpriteRef & { anim: string };
type BlockerSpriteRef = SpriteRef & { scale: number; hpBoost: number; anim: string };

type PanelView = {
  teamId: number;
  rect: Rect;
  laneGlow: unknown;
  soldiers: SoldierView[];
  targets: TargetView[];
  blockers: BlockerView[];
  pickup: PickupView | null;
  boss: unknown;
  bossHpText: unknown;
  teamLabel: unknown;
  statLabel: unknown;
  baseHpFill: unknown;
  baseHpText: unknown;
  verdict: unknown;
};

const v2AssetBase = '/math-rush-battle-v2';
const roadPerspective = {
  topY: 0.235,
  bottomY: 0.985,
  topLeft: 0.442,
  topRight: 0.558,
  bottomLeft: -0.018,
  bottomRight: 1.018
};
const pickupKinds: PickupKind[] = ['rapid', 'multi', 'soldier', 'shield', 'rocket', 'freeze', 'heal', 'magnet', 'laser', 'drone', 'bomb', 'overdrive'];
const pickupSprites: Record<PickupKind, SpriteRef> = {
  rapid: { texture: 'runner-extra-atlas-v3', frame: 8 },
  multi: { texture: 'runner-extra-atlas-v3', frame: 9 },
  soldier: { texture: 'runner-extra-atlas-v3', frame: 10 },
  shield: { texture: 'runner-extra-atlas-v3', frame: 11 },
  rocket: { texture: 'runner-extra-atlas-v3', frame: 12 },
  freeze: { texture: 'runner-extra-atlas-v3', frame: 13 },
  heal: { texture: 'runner-extra-atlas-v3', frame: 14 },
  magnet: { texture: 'runner-extra-atlas-v3', frame: 15 },
  laser: { texture: 'projectiles-fx-sheet', frame: 3 },
  drone: { texture: 'gates-pickups-sheet', frame: 5 },
  bomb: { texture: 'projectiles-fx-sheet', frame: 4 },
  overdrive: { texture: 'gates-pickups-sheet', frame: 7 }
};

const pickupLabels: Record<PickupKind, string> = {
  rapid: 'RAPID',
  multi: 'x3',
  soldier: '+2',
  shield: 'SAFE',
  rocket: 'BOOM',
  freeze: 'ICE',
  heal: '+HP',
  magnet: 'MAG',
  laser: 'LASER',
  drone: 'DRONE',
  bomb: 'BLAST',
  overdrive: 'MAX'
};

const actionFrameCount = 4;
const enemySprites: EnemySpriteRef[] = Array.from({ length: 12 }, (_, index) => ({
  texture: 'enemy-walk-sheet-v1',
  frame: (index % 4) * actionFrameCount,
  anim: `enemy-walk-${index % 4}`
}));

const blockerSprites: BlockerSpriteRef[] = [
  { texture: 'enemy-walk-sheet-v1', frame: 2 * actionFrameCount, scale: 1.18, hpBoost: 108, anim: 'enemy-walk-2' },
  { texture: 'enemy-walk-sheet-v1', frame: 3 * actionFrameCount, scale: 1.22, hpBoost: 96, anim: 'enemy-walk-3' },
  { texture: 'enemy-walk-sheet-v1', frame: 1 * actionFrameCount, scale: 1.12, hpBoost: 84, anim: 'enemy-walk-1' },
  { texture: 'enemy-walk-sheet-v1', frame: 0, scale: 1.2, hpBoost: 72, anim: 'enemy-walk-0' }
];

const teamPalette: Record<TeamColor, { main: number; css: string }> = {
  blue: { main: 0x2d7cff, css: '#2d7cff' },
  red: { main: 0xff4d4d, css: '#ff4d4d' },
  green: { main: 0x42ba5f, css: '#42ba5f' },
  purple: { main: 0x8c5bff, css: '#8c5bff' }
};

const teamSeeds: Array<Pick<TeamStatus, 'label' | 'teamName' | 'color'>> = [
  { label: '1P', teamName: 'A팀', color: 'blue' },
  { label: '2P', teamName: 'B팀', color: 'red' },
  { label: '3P', teamName: 'C팀', color: 'green' },
  { label: '4P', teamName: 'D팀', color: 'purple' }
];
const allAreaIds = curriculumAreas.map((area) => area.id);
const defaultSelectedGrades = [3, 4];
const defaultSelectedUnitKeys = curriculumUnits
  .filter((unit) => defaultSelectedGrades.includes(unit.grade))
  .map((unit) => unit.key);

function createTeams(playerCount: number): TeamStatus[] {
  return teamSeeds.slice(0, playerCount).map((seed, index) => ({
    id: index,
    ...seed,
    score: 0,
    hp: 100,
    maxHp: 100,
    soldiers: 1,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    attempts: 0,
    lane: 1,
    position: 0.5,
    weaponLevel: 1,
    shield: 0,
    rapidUntil: 0,
    spreadUntil: 0,
    missileUntil: 0,
    laserUntil: 0,
    magnetPower: 0
  }));
}

function cloneTeams(teams: TeamStatus[]): TeamStatus[] {
  return teams.map((team) => ({ ...team }));
}

function getAccuracy(team: TeamStatus) {
  if (team.attempts === 0) {
    return 0;
  }

  return Math.round((team.correct / team.attempts) * 100);
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function visibleCurriculumUnits(selectedGrades: number[], selectedAreas: CurriculumAreaId[]) {
  return curriculumUnits.filter((unit) => selectedGrades.includes(unit.grade) && selectedAreas.includes(unit.area));
}

function makeProblem(round: number, mode: RoundMode, problemPool: Problem[]): Problem {
  const pool = problemPool.length > 0 ? problemPool : allCurriculumProblems;
  const source = pool[(round * 7 + (mode === 'boss' ? 11 : 0)) % pool.length];
  return {
    ...source,
    choices: shuffle(source.choices)
  };
}

function rankTeams(teams: TeamStatus[]) {
  const contenders = teams.some((team) => team.hp > 0) ? teams.filter((team) => team.hp > 0) : teams;
  const topScore = Math.max(...contenders.map((team) => team.score));
  return contenders.filter((team) => team.score === topScore);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function nearestLane(position: number) {
  return clamp(Math.floor(clamp(position, 0, 0.999) * 3), 0, 2);
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export default function MathRushBattleClient() {
  const [phase, setPhase] = useState<PlayPhase>('menu');
  const [playerCount, setPlayerCount] = useState(1);
  const [selectedGrades, setSelectedGrades] = useState<number[]>(defaultSelectedGrades);
  const [selectedAreas, setSelectedAreas] = useState<CurriculumAreaId[]>(allAreaIds);
  const [selectedUnitKeys, setSelectedUnitKeys] = useState<string[]>(defaultSelectedUnitKeys);
  const [runId, setRunId] = useState(0);
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const apiRef = useRef<GameApi | null>(null);
  const visibleUnits = useMemo(() => visibleCurriculumUnits(selectedGrades, selectedAreas), [selectedAreas, selectedGrades]);
  const selectedVisibleUnitKeys = useMemo(() => {
    const visibleKeys = new Set(visibleUnits.map((unit) => unit.key));
    return selectedUnitKeys.filter((key) => visibleKeys.has(key));
  }, [selectedUnitKeys, visibleUnits]);
  const problemPool = useMemo(() => getProblemPool(selectedVisibleUnitKeys), [selectedVisibleUnitKeys]);
  const selectedUnitKeySet = useMemo(() => new Set(selectedVisibleUnitKeys), [selectedVisibleUnitKeys]);

  const startGame = useCallback(() => {
    setRound(null);
    setSummary(null);
    setRunId((value) => value + 1);
    setPhase('playing');
  }, [playerCount, problemPool]);

  const backToMenu = useCallback(() => {
    apiRef.current = null;
    setPhase('menu');
    setRound(null);
  }, []);

  const handleStats = useCallback((nextTeams: TeamStatus[]) => {
    void nextTeams;
  }, []);

  const handleRound = useCallback((nextRound: RoundInfo) => {
    setRound(nextRound);
  }, []);

  const handleFinish = useCallback((nextSummary: GameSummary) => {
    setSummary(nextSummary);
    setPhase('result');
  }, []);

  const handleApi = useCallback((api: GameApi | null) => {
    apiRef.current = api;
  }, []);

  const toggleGrade = useCallback((grade: number) => {
    setSelectedGrades((currentGrades) => {
      const adding = !currentGrades.includes(grade);
      if (!adding && currentGrades.length === 1) {
        return currentGrades;
      }
      const nextGrades = adding
        ? [...currentGrades, grade].sort((a, b) => a - b)
        : currentGrades.filter((item) => item !== grade);
      const nextVisibleUnits = visibleCurriculumUnits(nextGrades, selectedAreas);
      setSelectedUnitKeys((currentKeys) => {
        const allowed = new Set(nextVisibleUnits.map((unit) => unit.key));
        const retained = currentKeys.filter((key) => allowed.has(key));
        if (adding) {
          const added = nextVisibleUnits.filter((unit) => unit.grade === grade).map((unit) => unit.key);
          return Array.from(new Set([...retained, ...added]));
        }
        return retained.length > 0 ? retained : nextVisibleUnits.map((unit) => unit.key);
      });
      return nextGrades;
    });
  }, [selectedAreas]);

  const toggleArea = useCallback((area: CurriculumAreaId) => {
    setSelectedAreas((currentAreas) => {
      const adding = !currentAreas.includes(area);
      if (!adding && currentAreas.length === 1) {
        return currentAreas;
      }
      const nextAreas = adding
        ? [...currentAreas, area]
        : currentAreas.filter((item) => item !== area);
      const nextVisibleUnits = visibleCurriculumUnits(selectedGrades, nextAreas);
      setSelectedUnitKeys((currentKeys) => {
        const allowed = new Set(nextVisibleUnits.map((unit) => unit.key));
        const retained = currentKeys.filter((key) => allowed.has(key));
        if (adding) {
          const added = nextVisibleUnits.filter((unit) => unit.area === area).map((unit) => unit.key);
          return Array.from(new Set([...retained, ...added]));
        }
        return retained.length > 0 ? retained : nextVisibleUnits.map((unit) => unit.key);
      });
      return nextAreas;
    });
  }, [selectedGrades]);

  const toggleUnit = useCallback((unitKey: string) => {
    setSelectedUnitKeys((currentKeys) => {
      const visibleKeys = new Set(visibleUnits.map((unit) => unit.key));
      const selectedVisibleCount = currentKeys.filter((key) => visibleKeys.has(key)).length;
      if (currentKeys.includes(unitKey)) {
        if (selectedVisibleCount <= 1) {
          return currentKeys;
        }
        return currentKeys.filter((key) => key !== unitKey);
      }
      return [...currentKeys, unitKey];
    });
  }, [visibleUnits]);

  const selectAllVisibleUnits = useCallback(() => {
    setSelectedUnitKeys(visibleUnits.map((unit) => unit.key));
  }, [visibleUnits]);

  return (
    <main className={styles.shell}>
      {phase === 'menu' ? (
        <section className={styles.menuScreen}>
          <div className={styles.menuBackdrop}>
            <img alt="" src={`${v2AssetBase}/assets/frames/runner-asset-04.png`} />
            <img alt="" src={`${v2AssetBase}/assets/frames/runner-asset-09.png`} />
            <img alt="" src={`${v2AssetBase}/assets/frames/runner-asset-15.png`} />
          </div>

          <div className={styles.titleBlock}>
            <h1>수학 러시 배틀</h1>
          </div>

          <div className={styles.playerGrid} aria-label="플레이 인원 선택">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                className={`${styles.playerCard} ${playerCount === count ? styles.selectedCard : ''}`}
                onClick={() => setPlayerCount(count)}
                type="button"
              >
                <span className={styles.cardGlow} />
                <img alt="" src={`${v2AssetBase}/assets/frames/runner-asset-0${count - 1}.png`} />
                <strong>{count}P</strong>
              </button>
            ))}
          </div>

          <section className={styles.curriculumPanel} aria-label="문제 범위 선택">
            <div className={styles.curriculumHeader}>
              <span>문제 범위</span>
              <strong>{problemPool.length.toLocaleString()}문항</strong>
            </div>

            <div className={styles.filterRow}>
              <span>학년</span>
              <div className={styles.filterChips}>
                {curriculumGrades.map((grade) => (
                  <button
                    key={grade}
                    aria-pressed={selectedGrades.includes(grade)}
                    className={`${styles.filterChip} ${selectedGrades.includes(grade) ? styles.activeChip : ''}`}
                    onClick={() => toggleGrade(grade)}
                    type="button"
                  >
                    {grade}학년
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterRow}>
              <span>영역</span>
              <div className={styles.filterChips}>
                {curriculumAreas.map((area) => (
                  <button
                    key={area.id}
                    aria-pressed={selectedAreas.includes(area.id)}
                    className={`${styles.filterChip} ${selectedAreas.includes(area.id) ? styles.activeChip : ''}`}
                    onClick={() => toggleArea(area.id)}
                    type="button"
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.unitHeader}>
              <span>단원</span>
              <button onClick={selectAllVisibleUnits} type="button">현재 단원 전체</button>
            </div>
            <div className={styles.unitGrid}>
              {visibleUnits.map((unit) => (
                <button
                  key={unit.key}
                  aria-pressed={selectedUnitKeySet.has(unit.key)}
                  className={`${styles.unitChip} ${selectedUnitKeySet.has(unit.key) ? styles.activeUnitChip : ''}`}
                  onClick={() => toggleUnit(unit.key)}
                  type="button"
                >
                  <span>{unit.grade}학년</span>
                  <strong>{unit.label}</strong>
                  <em>{unit.problems.length}문항</em>
                </button>
              ))}
            </div>
          </section>

          <button className={styles.startButton} onClick={startGame} type="button">
            <Play size={24} fill="currentColor" />
            게임 시작 · {problemPool.length.toLocaleString()}문항
          </button>
        </section>
      ) : null}

      {phase === 'playing' ? (
        <section className={styles.gameScreen}>
          <div className={styles.playField}>
            <div className={styles.topHud}>
              <div className={styles.roundPanel}>
                <span>ROUND</span>
                <strong>{round?.number ?? 1}</strong>
              </div>
              <div className={styles.problemPanel}>
                <span>{round?.mode === 'boss' ? 'BOSS ROUND' : round?.problem.unit ?? 'READY'}</span>
                <strong>{round?.problem.prompt ?? '전투 준비 중...'}</strong>
              </div>
              <div className={styles.bossPanel}>
                <span>{round?.mode === 'boss' ? 'BOSS HP' : 'MISSION'}</span>
                <strong>{round?.mode === 'boss' ? `${Math.max(0, round.bossHp)} / ${round.bossMaxHp}` : round?.message ?? '배 숫자 정답 찾기'}</strong>
              </div>
            </div>
            <PhaserSurface
              key={runId}
              onApi={handleApi}
              onFinish={handleFinish}
              onRound={handleRound}
              onStats={handleStats}
              playerCount={playerCount}
              problemPool={problemPool}
              runId={runId}
            />
          </div>
        </section>
      ) : null}

      {phase === 'result' && summary ? (
        <section className={styles.resultScreen}>
          <div className={styles.resultHeader}>
            <h1>
              {summary.teams.some((team) => team.hp > 0)
                ? `${summary.winners.map((team) => team.teamName).join(' · ')} 승리!`
                : '기지 방어 실패!'}
            </h1>
          </div>

          <div className={styles.resultGrid}>
            {summary.teams
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((team) => (
                <article key={team.id} className={`${styles.resultCard} ${styles[team.color]}`}>
                  <div className={styles.resultCardTop}>
                    <strong>{team.label} {team.teamName}</strong>
                    <span>{team.score.toLocaleString()}점</span>
                  </div>
                  <dl>
                    <div>
                      <dt>정답률</dt>
                      <dd>{getAccuracy(team)}%</dd>
                    </div>
                    <div>
                      <dt>최대 콤보</dt>
                      <dd>{team.maxCombo}</dd>
                    </div>
                    <div>
                      <dt>남은 인원</dt>
                      <dd>{team.soldiers}</dd>
                    </div>
                    <div>
                      <dt>기지 HP</dt>
                      <dd>{team.hp}/{team.maxHp}</dd>
                    </div>
                    <div>
                      <dt>무기</dt>
                      <dd>Lv.{team.weaponLevel}</dd>
                    </div>
                  </dl>
                </article>
              ))}
          </div>

          <div className={styles.resultActions}>
            <button onClick={startGame} type="button">
              <RotateCcw size={22} />
              다시 플레이
            </button>
            <button onClick={backToMenu} type="button">
              <UsersRound size={22} />
              인원 다시 선택
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PhaserSurface({ playerCount, problemPool, runId, onApi, onFinish, onRound, onStats }: PhaserSurfaceProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas?: boolean) => void } | null = null;

    async function bootGame() {
      const host = mountRef.current;
      if (!host) {
        return;
      }

      const module = await import('phaser');
      const Phaser = ('default' in module && module.default ? module.default : module) as Record<string, any>;
      if (cancelled) {
        return;
      }

      game = createPhaserGame(Phaser, host, {
        playerCount,
        problemPool,
        onApi,
        onFinish,
        onRound,
        onStats
      });
    }

    bootGame();

    return () => {
      cancelled = true;
      onApi(null);
      game?.destroy(true);
    };
  }, [onApi, onFinish, onRound, onStats, playerCount, problemPool, runId]);

  return <div className={styles.canvasMount} ref={mountRef} />;
}

function createPhaserGame(Phaser: Record<string, any>, host: HTMLDivElement, callbacks: Omit<PhaserSurfaceProps, 'runId'>) {
  const config: Record<string, any> = {
    type: Phaser.AUTO,
    parent: host,
    width: Math.max(900, host.clientWidth || 1200),
    height: Math.max(620, host.clientHeight || 720),
    backgroundColor: '#172234',
    transparent: false,
    input: {
      activePointers: Math.min(10, Math.max(4, callbacks.playerCount)),
      windowEvents: true
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: host,
      width: '100%',
      height: '100%'
    },
    scene: []
  };

  class RushScene extends Phaser.Scene {
    teams: TeamStatus[];
    panels: PanelView[];
    projectiles: ProjectileView[];
    worldLayer: any;
    fxLayer: any;
    problem: Problem | null;
    problemPool: Problem[];
    phase: ScenePhase;
    round: number;
    maxRounds: number;
    bossStartRound: number;
    bossHp: number;
    bossMaxHp: number;
    roundElapsed: number;
    roundDuration: number;
    shootClock: number;
    shootInterval: number;
    resolvedTeams: Set<number>;
    inputDirections: number[];
    activePointerTeams: Map<number, number>;
    teamActivePointers: Map<number, number>;
    inputKeys: Record<string, any>;
    statsPulse: number;
    movementDirty: boolean;

    constructor() {
      super('rush-scene');
      this.teams = createTeams(callbacks.playerCount);
      this.panels = [];
      this.projectiles = [];
      this.worldLayer = null;
      this.fxLayer = null;
      this.problem = null;
      this.problemPool = callbacks.problemPool.length > 0 ? callbacks.problemPool : allCurriculumProblems;
      this.phase = 'loading';
      this.round = 0;
      this.maxRounds = 9;
      this.bossStartRound = 6;
      this.bossMaxHp = 160 + callbacks.playerCount * 45;
      this.bossHp = this.bossMaxHp;
      this.roundElapsed = 0;
      this.roundDuration = 12800;
      this.shootClock = 0;
      this.shootInterval = 245;
      this.resolvedTeams = new Set();
      this.inputDirections = [0, 0, 0, 0];
      this.activePointerTeams = new Map();
      this.teamActivePointers = new Map();
      this.inputKeys = {};
      this.statsPulse = 0;
      this.movementDirty = false;
    }

    preload() {
      this.load.image('road-bg-v3', `${v2AssetBase}/assets/road-bg-v3.png`);
      this.load.spritesheet('runner-atlas-v2', `${v2AssetBase}/assets/runner-battle-atlas-v2.png`, {
        frameWidth: 256,
        frameHeight: 256
      });
      this.load.spritesheet('runner-extra-atlas-v3', `${v2AssetBase}/assets/runner-extra-atlas-v3.png`, {
        frameWidth: 256,
        frameHeight: 256
      });
      this.load.spritesheet('hero-run-shoot-sheet-v1', `${v2AssetBase}/assets/hero-run-shoot-sheet-v1.png`, {
        frameWidth: 256,
        frameHeight: 256
      });
      this.load.spritesheet('enemy-walk-sheet-v1', `${v2AssetBase}/assets/enemy-walk-sheet-v1.png`, {
        frameWidth: 256,
        frameHeight: 256
      });
      this.load.spritesheet('gates-pickups-sheet', `${v2AssetBase}/assets/gates-pickups-sheet.png`, {
        frameWidth: 256,
        frameHeight: 256
      });
      this.load.spritesheet('projectiles-fx-sheet', `${v2AssetBase}/assets/projectiles-fx-sheet.png`, {
        frameWidth: 256,
        frameHeight: 256
      });
      this.load.spritesheet('boss-math-sheet', `${v2AssetBase}/assets/boss-math-sheet.png`, {
        frameWidth: 384,
        frameHeight: 384
      });
    }

    create() {
      this.worldLayer = this.add.container(0, 0);
      this.fxLayer = this.add.container(0, 0);
      this.createHeroAnimations();
      this.createEnemyAnimations();
      this.rebuildArena();
      this.bindInput();
      callbacks.onStats(cloneTeams(this.teams));
      callbacks.onApi({
        moveTeam: (teamId, delta) => this.moveTeam(teamId, delta),
        setTeamPosition: (teamId, position) => this.setTeamPosition(teamId, position, true, true),
        setTeamDirection: (teamId, direction) => this.setTeamDirection(teamId, direction)
      });
      this.time.delayedCall(400, () => this.startRound());
    }

    createEnemyAnimations() {
      enemySprites.forEach((sprite, index) => {
        if (this.anims.exists(sprite.anim)) {
          return;
        }
        this.anims.create({
          key: sprite.anim,
          frames: Array.from({ length: actionFrameCount }, (_, frameIndex) => ({
            key: sprite.texture,
            frame: sprite.frame + frameIndex
          })),
          frameRate: 7 + (index % 3),
          repeat: -1
        });
      });
    }

    createHeroAnimations() {
      teamSeeds.forEach((_, teamIndex) => {
        const key = `hero-run-shoot-${teamIndex}`;
        if (this.anims.exists(key)) {
          return;
        }
        this.anims.create({
          key,
          frames: Array.from({ length: actionFrameCount }, (_, frameIndex) => ({
            key: 'hero-run-shoot-sheet-v1',
            frame: teamIndex * actionFrameCount + frameIndex
          })),
          frameRate: 9,
          repeat: -1
        });
      });
    }

    teamThreatPressure(team: TeamStatus) {
      const squadPressure = Math.pow(team.soldiers, 1.35) * 28;
      const weaponPressure = team.weaponLevel * 34;
      const boostPressure = [
        team.rapidUntil > this.roundElapsed ? 34 : 0,
        team.spreadUntil > this.roundElapsed ? 42 : 0,
        team.missileUntil > this.roundElapsed ? 34 : 0,
        team.laserUntil > this.roundElapsed ? 38 : 0
      ].reduce((sum, value) => sum + value, 0);
      return squadPressure + weaponPressure + boostPressure;
    }

    projectileDamage(team: TeamStatus, laserActive: boolean, missileBoost: boolean) {
      const levelBonus = Math.max(0, team.weaponLevel - 1);
      const squadBonus = Math.floor(Math.sqrt(team.soldiers));
      if (laserActive) {
        return 7 + levelBonus * 2 + squadBonus;
      }
      if (missileBoost) {
        return 8 + levelBonus * 2 + squadBonus;
      }
      return 5 + Math.floor(levelBonus * 1.35) + Math.floor(Math.max(0, team.soldiers - 1) / 6);
    }

    update(_time: number, delta: number) {
      if (this.phase !== 'running' || !this.problem) {
        return;
      }

      this.roundElapsed += delta;
      this.shootClock += delta;
      this.statsPulse += delta;
      this.updateContinuousMovement(delta);
      this.updateTargetPositions();
      this.updateBlockerPositions();
      this.updatePickupPositions();
      this.updateProjectiles(delta);

      while (this.shootClock >= this.shootInterval) {
        this.shootClock -= this.shootInterval;
        this.shootAllTeams();
      }

      if (this.roundElapsed >= this.roundDuration) {
        this.resolveMissedTeams();
        this.scheduleNextRound();
      }

      if (this.movementDirty && this.statsPulse >= 80) {
        this.statsPulse = 0;
        this.movementDirty = false;
        callbacks.onStats(cloneTeams(this.teams));
      }
    }

    bindInput() {
      this.input.mouse?.disableContextMenu();

      this.input.on('pointerdown', (pointer: ScenePointer) => {
        const panel = this.panels.find((item) => {
          const { rect } = item;
          return pointer.x >= rect.x && pointer.x <= rect.x + rect.width && pointer.y >= rect.y && pointer.y <= rect.y + rect.height;
        });
        const team = panel ? this.teams[panel.teamId] : undefined;
        if (!panel || !this.isTeamActive(team)) {
          return;
        }
        this.claimPointerForTeam(pointer, panel.teamId);
        this.setTeamPositionFromPointer(panel, pointer.x, true);
      });

      this.input.on('pointermove', (pointer: ScenePointer) => {
        const panel = this.panelForPointer(pointer);
        const team = panel ? this.teams[panel.teamId] : undefined;
        if (!panel || !this.isTeamActive(team)) {
          return;
        }
        this.setTeamPositionFromPointer(panel, pointer.x, false);
      });

      this.input.on('pointerup', (pointer: ScenePointer) => {
        this.releasePointer(pointer);
      });
      this.input.on('pointerupoutside', (pointer: ScenePointer) => {
        this.releasePointer(pointer);
      });
      this.input.on('pointercancel', (pointer: ScenePointer) => {
        this.releasePointer(pointer);
      });

      this.inputKeys = this.input.keyboard?.addKeys({
        p1Left: 'A',
        p1Right: 'D',
        p1AltLeft: 'LEFT',
        p1AltRight: 'RIGHT',
        p2Left: 'J',
        p2Right: 'L',
        p3Left: 'F',
        p3Right: 'H',
        p4Left: 'N',
        p4Right: 'M'
      }) ?? {};
    }

    pointerKey(pointer: ScenePointer) {
      return pointer.id ?? pointer.pointerId ?? pointer.identifier ?? 0;
    }

    claimPointerForTeam(pointer: ScenePointer, teamId: number) {
      const pointerId = this.pointerKey(pointer);
      const previousPointerId = this.teamActivePointers.get(teamId);
      if (previousPointerId !== undefined && previousPointerId !== pointerId) {
        this.activePointerTeams.delete(previousPointerId);
      }
      this.activePointerTeams.set(pointerId, teamId);
      this.teamActivePointers.set(teamId, pointerId);
    }

    panelForPointer(pointer: ScenePointer) {
      const teamId = this.activePointerTeams.get(this.pointerKey(pointer));
      return teamId === undefined ? null : this.panels[teamId] ?? null;
    }

    releasePointer(pointer: ScenePointer) {
      const pointerId = this.pointerKey(pointer);
      const teamId = this.activePointerTeams.get(pointerId);
      this.activePointerTeams.delete(pointerId);
      if (teamId !== undefined && this.teamActivePointers.get(teamId) === pointerId) {
        this.teamActivePointers.delete(teamId);
      }
    }

    rebuildArena() {
      this.worldLayer?.destroy(true);
      this.fxLayer?.destroy(true);
      this.worldLayer = this.add.container(0, 0);
      this.fxLayer = this.add.container(0, 0);
      this.panels = [];
      this.projectiles = [];

      const width = Number(this.scale.width);
      const height = Number(this.scale.height);
      const background = this.add.graphics();
      background.fillGradientStyle(0x8b6740, 0x8b6740, 0x152238, 0x101826, 1);
      background.fillRect(0, 0, width, height);
      this.worldLayer.add(background);

      const rects = getPanelRects(width, height, callbacks.playerCount);
      rects.forEach((rect, index) => this.createPanel(rect, this.teams[index]));
    }

    createPanel(rect: Rect, team: TeamStatus) {
      const palette = teamPalette[team.color];
      const panelFrame = this.add.graphics();
      panelFrame.fillStyle(0x0b1322, 0.5);
      panelFrame.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 18);
      panelFrame.lineStyle(4, palette.main, 0.55);
      panelFrame.strokeRoundedRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4, 16);
      this.worldLayer.add(this.drawRoad(rect));
      this.worldLayer.add(panelFrame);

      const laneGlow = this.add.graphics();
      this.worldLayer.add(laneGlow);

      const topSize = Math.max(18, Math.min(32, rect.width * 0.04));
      const teamLabel = this.add.text(rect.x + 18, rect.y + 14, `${team.label} ${team.teamName}`, {
        color: '#ffffff',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${topSize}px`,
        fontStyle: '900',
        stroke: '#0b1220',
        strokeThickness: 5
      });
      this.worldLayer.add(teamLabel);

      const statLabel = this.add.text(rect.x + rect.width - 18, rect.y + 16, '', {
        align: 'right',
        color: '#fff9d6',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${Math.max(14, topSize * 0.72)}px`,
        fontStyle: '800',
        stroke: '#0b1220',
        strokeThickness: 4
      }).setOrigin(1, 0);
      this.worldLayer.add(statLabel);

      const boss = this.add.sprite(rect.x + rect.width * 0.5, rect.y + rect.height * 0.23, 'boss-math-sheet', 0);
      boss.setVisible(false);
      boss.setAlpha(0.72);
      boss.setScale(Math.max(0.24, Math.min(0.62, rect.width / 1180)));
      this.worldLayer.add(boss);

      const bossHpText = this.add.text(rect.x + rect.width * 0.5, rect.y + rect.height * 0.12, '', {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${Math.max(16, rect.width * 0.035)}px`,
        fontStyle: '900',
        stroke: '#0b1220',
        strokeThickness: 5
      }).setOrigin(0.5);
      this.worldLayer.add(bossHpText);

      const verdict = this.add.text(rect.x + rect.width * 0.5, rect.y + rect.height * 0.55, '', {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${Math.max(24, rect.width * 0.06)}px`,
        fontStyle: '900',
        stroke: '#0b1220',
        strokeThickness: 8
      }).setOrigin(0.5).setAlpha(0);
      this.worldLayer.add(verdict);

      const baseHpWidth = Math.max(180, Math.min(340, rect.width * 0.34));
      const baseHpY = rect.y + rect.height - 34;
      const baseHpX = rect.x + rect.width * 0.5 - baseHpWidth / 2;
      const baseHpBack = this.add.rectangle(baseHpX, baseHpY, baseHpWidth, 18, 0x111a2a, 0.86).setOrigin(0, 0.5);
      baseHpBack.setStrokeStyle(2, 0xffffff, 0.38);
      const baseHpFill = this.add.rectangle(baseHpX + 3, baseHpY, baseHpWidth - 6, 12, 0x5ff27a, 1).setOrigin(0, 0.5);
      const baseHpText = this.add.text(rect.x + rect.width * 0.5, baseHpY - 24, '', {
        align: 'center',
        color: '#fff9d6',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${Math.max(12, rect.width * 0.018)}px`,
        fontStyle: '950',
        stroke: '#101827',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.worldLayer.add(baseHpBack);
      this.worldLayer.add(baseHpFill);
      this.worldLayer.add(baseHpText);

      const panel: PanelView = {
        teamId: team.id,
        rect,
        laneGlow,
        soldiers: [],
        targets: [],
        blockers: [],
        pickup: null,
        boss,
        bossHpText,
        teamLabel,
        statLabel,
        baseHpFill,
        baseHpText,
        verdict
      };
      this.panels.push(panel);
      this.syncSoldiers(panel, team, false);
      this.refreshPanelStats(team.id);
    }

    drawRoad(rect: Rect) {
      const road = this.add.container(0, 0);
      const background = this.add.image(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5, 'road-bg-v3');
      background.setDisplaySize(rect.width, rect.height);
      road.add(background);
      const roadOverlay = this.add.graphics();
      roadOverlay.fillStyle(0x0d1524, 0.2);
      roadOverlay.fillRoundedRect(rect.x + rect.width * 0.01, rect.y + rect.height * 0.03, rect.width * 0.98, rect.height * 0.94, 18);
      road.add(roadOverlay);
      return road;
    }

    roadTopY(rect: Rect) {
      return rect.y + rect.height * roadPerspective.topY;
    }

    roadBottomY(rect: Rect) {
      return rect.y + rect.height * roadPerspective.bottomY;
    }

    roadEdges(rect: Rect, y: number) {
      const topY = this.roadTopY(rect);
      const bottomY = this.roadBottomY(rect);
      const t = clamp((y - topY) / (bottomY - topY), 0, 1);
      return {
        left: lerp(rect.x + rect.width * roadPerspective.topLeft, rect.x + rect.width * roadPerspective.bottomLeft, t),
        right: lerp(rect.x + rect.width * roadPerspective.topRight, rect.x + rect.width * roadPerspective.bottomRight, t)
      };
    }

    roadDepth(rect: Rect, y: number) {
      const topY = this.roadTopY(rect);
      const bottomY = this.roadBottomY(rect);
      return clamp((y - topY) / (bottomY - topY), 0, 1);
    }

    roadPositionFromX(rect: Rect, x: number, y: number) {
      const edges = this.roadEdges(rect, y);
      return clamp((x - edges.left) / (edges.right - edges.left), 0.04, 0.96);
    }

    targetPerspectiveScale(rect: Rect, y: number) {
      return lerp(0.62, 1.16, this.roadDepth(rect, y));
    }

    pickupPerspectiveScale(rect: Rect, y: number) {
      return lerp(0.72, 1.1, this.roadDepth(rect, y));
    }

    pickupTravelProgress(progress: number) {
      return clamp(progress * 1.55 + 0.08, 0, 1);
    }

    projectilePerspectiveScale(rect: Rect, y: number) {
      return lerp(0.58, 1.08, this.roadDepth(rect, y));
    }

    projectileCeilingY(rect: Rect) {
      return this.roadTopY(rect) + rect.height * 0.018;
    }

    defenseLineY(rect: Rect) {
      return rect.y + rect.height * 0.79;
    }

    roadX(rect: Rect, position: number, y: number) {
      const edges = this.roadEdges(rect, y);
      return lerp(edges.left, edges.right, clamp(position, 0.04, 0.96));
    }

    roadBoundaryX(rect: Rect, boundary: number, y: number) {
      const edges = this.roadEdges(rect, y);
      return lerp(edges.left, edges.right, boundary / 3);
    }

    isTeamActive(team: TeamStatus | undefined) {
      return Boolean(team && team.hp > 0);
    }

    activeTeamCount() {
      return this.teams.filter((team) => this.isTeamActive(team)).length;
    }

    allBasesDown() {
      return this.activeTeamCount() === 0;
    }

    releasePointersForTeam(teamId: number) {
      const pointerId = this.teamActivePointers.get(teamId);
      if (pointerId !== undefined) {
        this.activePointerTeams.delete(pointerId);
        this.teamActivePointers.delete(teamId);
      }
      this.inputDirections[teamId] = 0;
    }

    disableTeamPanel(panel: PanelView, team: TeamStatus, message = 'BASE DOWN!') {
      this.releasePointersForTeam(team.id);
      this.clearProjectiles(team.id);
      this.clearTargets(panel);
      this.setPanelVerdict(panel, message);
      const glow = panel.laneGlow as any;
      glow.clear();
      panel.soldiers.forEach((soldier) => {
        const root = soldier.root as any;
        root.setAlpha(0.28);
      });
      this.refreshPanelStats(team.id);
    }

    startRound() {
      if (this.phase === 'finished') {
        return;
      }
      if (this.allBasesDown()) {
        this.finishGame();
        return;
      }

      this.round += 1;
      const mode: RoundMode = this.round >= this.bossStartRound ? 'boss' : 'targets';
      this.problem = makeProblem(this.round, mode, this.problemPool);
      this.roundElapsed = 0;
      this.shootClock = 0;
      this.resolvedTeams.clear();
      this.phase = 'running';

      this.panels.forEach((panel) => {
        const team = this.teams[panel.teamId];
        const boss = panel.boss as any;
        const bossHpText = panel.bossHpText as any;
        boss.setVisible(mode === 'boss');
        bossHpText.setText(mode === 'boss' ? `HP ${Math.max(0, this.bossHp)} / ${this.bossMaxHp}` : '');
        this.setPanelVerdict(panel, '');
        this.clearProjectiles(panel.teamId);
        this.clearTargets(panel);
        if (!this.isTeamActive(team)) {
          if (team) {
            this.resolvedTeams.add(team.id);
            this.disableTeamPanel(panel, team, 'BASE DOWN!');
          }
          return;
        }
        this.createTargets(panel, this.problem as Problem, mode);
        this.createBlockers(panel, mode);
        this.createPickup(panel);
      });

      callbacks.onRound({
        number: this.round,
        mode,
        problem: this.problem,
        bossHp: this.bossHp,
        bossMaxHp: this.bossMaxHp,
        message: mode === 'boss' ? '배 숫자 정답 보스 격파' : '배 숫자 정답 찾기'
      });
      callbacks.onStats(cloneTeams(this.teams));
    }

    clearTargets(panel: PanelView) {
      panel.targets.forEach((target) => (target.root as any).destroy());
      panel.targets = [];
      panel.blockers.forEach((blocker) => (blocker.root as any).destroy());
      panel.blockers = [];
      if (panel.pickup) {
        (panel.pickup.root as any).destroy();
        panel.pickup = null;
      }
    }

    clearProjectiles(panelId?: number) {
      this.projectiles = this.projectiles.filter((projectile) => {
        if (panelId !== undefined && projectile.panelId !== panelId) {
          return true;
        }
        projectile.alive = false;
        (projectile.root as any).destroy();
        return false;
      });
    }

    createTargets(panel: PanelView, problem: Problem, mode: RoundMode) {
      const team = this.teams[panel.teamId];
      if (!this.isTeamActive(team)) {
        return;
      }
      const threatPressure = this.teamThreatPressure(team);
      const scale = Math.max(0.36, Math.min(0.82, panel.rect.width / 820));
      problem.choices.forEach((choice, lane) => {
        const correct = choice === problem.answer;
        const position = (lane + 0.5) / 3;
        const y = panel.rect.y + panel.rect.height * ([0.32, 0.24, 0.33][lane] ?? 0.31);
        const x = this.roadX(panel.rect, position, y);
        const enemyIndex = (this.round * 2 + lane + panel.teamId) % enemySprites.length;
        const enemySprite = mode === 'boss'
          ? enemySprites[7]
          : enemySprites[enemyIndex];
        const heavyBonus = [0, 9, 4, 13, 7, 15, 5, 11, 18, 6, 14, 10][enemyIndex] ?? 0;
        const elite = mode === 'boss' || this.round >= 4 || enemyIndex >= 4 || (this.round + lane + panel.teamId) % 4 === 0;
        const earlyEliteRelief = elite ? Math.max(0, 3 - this.round) * 24 : 0;
        const rawGauge = elite
          ? 210 + this.round * 28 + lane * 20 + heavyBonus + threatPressure * 0.5 - earlyEliteRelief
          : 146 + this.round * 20 + lane * 15 + Math.floor(heavyBonus * 0.7) + threatPressure * 0.36;
        const gauge = Math.floor(rawGauge * (correct ? 0.95 : 1.08) * (mode === 'boss' ? 1.12 : 1));
        const root = this.add.container(x, y);
        root.setScale(this.targetPerspectiveScale(panel.rect, y));
        root.setDepth(Math.floor(y) + 520);
        const monster = this.add.sprite(0, -6, enemySprite.texture, enemySprite.frame);
        monster.setScale(elite ? scale * 0.92 : scale * 0.78);
        monster.play(enemySprite.anim);
        this.tweens.add({
          targets: monster,
          angle: (lane % 2 === 0 ? 2.2 : -2.2),
          y: -11,
          duration: 360 + (enemyIndex % 3) * 70,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
        const barWidth = Math.max(78, panel.rect.width * 0.13);
        const barBack = this.add.rectangle(-barWidth / 2, -105, barWidth, 13, 0x1a2637, 0.92).setOrigin(0, 0.5);
        barBack.setStrokeStyle(2, 0xffffff, 0.65);
        const energyFill = this.add.rectangle(-barWidth / 2 + 2, -105, barWidth - 4, 9, elite ? 0xff5f55 : 0x57e36c, 1).setOrigin(0, 0.5);
        const choiceLabel = this.add.text(0, 34, String(choice), {
          align: 'center',
          color: '#ffffff',
          fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
          fontSize: `${Math.max(27, panel.rect.width * 0.055)}px`,
          fontStyle: '950',
          stroke: '#1b120b',
          strokeThickness: 8
        }).setOrigin(0.5);
        const eliteBadge = this.add.text(0, -126, elite ? 'HEAVY' : '', {
          align: 'center',
          color: '#ffe27a',
          fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
          fontSize: `${Math.max(10, panel.rect.width * 0.016)}px`,
          fontStyle: '950',
          stroke: '#23150a',
          strokeThickness: 3
        }).setOrigin(0.5);
        root.add([barBack, energyFill, eliteBadge, monster, choiceLabel]);
        this.worldLayer.add(root);
        panel.targets.push({
          lane,
          position,
          choice,
          elite,
          hp: gauge,
          maxHp: gauge,
          correct,
          defeated: false,
          breached: false,
          root,
          choiceLabel,
          energyFill,
          baseY: y,
          swayAmplitude: correct ? 0.026 : 0.018,
          swaySpeed: 1.15 + ((this.round + lane + panel.teamId) % 3) * 0.22,
          phase: (this.round + lane * 1.37 + panel.teamId * 0.7) * Math.PI * 0.5,
          speedMultiplier: 1 + ((this.round + lane + panel.teamId) % 4) * 0.06
        });
      });
    }

    createBlockers(panel: PanelView, mode: RoundMode) {
      const team = this.teams[panel.teamId];
      if (!this.isTeamActive(team)) {
        return;
      }
      const correctTarget = panel.targets.find((target) => target.correct);
      if (!correctTarget || this.round < 2) {
        return;
      }

      const count = mode === 'boss' || this.round >= 5 ? 2 : 1;
      const baseScale = Math.max(0.34, Math.min(0.78, panel.rect.width / 900));
      Array.from({ length: count }).forEach((_, index) => {
        const sprite = blockerSprites[(this.round + panel.teamId + index * 2) % blockerSprites.length];
        const fastDrop = (this.round + panel.teamId + index) % 3 === 0;
        const startPosition = clamp(correctTarget.position + (index === 0 ? -0.12 : 0.14), 0.17, 0.83);
        const baseY = panel.rect.y + panel.rect.height * (0.28 + index * 0.1);
        const x = this.roadX(panel.rect, startPosition, baseY);
        const root = this.add.container(x, baseY);
        root.setScale(this.targetPerspectiveScale(panel.rect, baseY));
        root.setDepth(Math.floor(baseY) + 620);

        const aura = this.add.sprite(0, 8, 'projectiles-fx-sheet', fastDrop ? 11 : 7);
        aura.setScale(baseScale * sprite.scale * 0.85);
        aura.setAlpha(fastDrop ? 0.58 : 0.4);
        const body = this.add.sprite(0, 0, sprite.texture, sprite.frame);
        body.setScale(baseScale * sprite.scale);
        body.play(sprite.anim);
        this.tweens.add({
          targets: body,
          angle: fastDrop ? 3.2 : 2.1,
          duration: fastDrop ? 280 : 430,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
        this.tweens.add({
          targets: body,
          scaleX: baseScale * sprite.scale * 0.97,
          scaleY: baseScale * sprite.scale * 1.035,
          duration: fastDrop ? 240 : 380,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
        this.tweens.add({
          targets: aura,
          angle: 360,
          duration: fastDrop ? 1100 : 1800,
          repeat: -1
        });
        const barWidth = Math.max(132, panel.rect.width * 0.2);
        const barBack = this.add.rectangle(-barWidth / 2, -142, barWidth, 18, 0x21131b, 0.94).setOrigin(0, 0.5);
        barBack.setStrokeStyle(3, 0xfff0a8, 0.82);
        const energyFill = this.add.rectangle(-barWidth / 2 + 3, -142, barWidth - 6, 12, fastDrop ? 0xff8b2d : 0xff4e6b, 1).setOrigin(0, 0.5);
        const guardIcon = this.add.sprite(0, -169, 'gates-pickups-sheet', 3);
        guardIcon.setScale(baseScale * 0.42);
        guardIcon.setAlpha(0.92);
        root.add([aura, body, barBack, energyFill, guardIcon]);
        this.worldLayer.add(root);

        const hp = Math.floor(235 + this.round * 46 + sprite.hpBoost * 1.18 + this.teamThreatPressure(team) * 0.72 + (fastDrop ? 62 : 0));
        panel.blockers.push({
          position: startPosition,
          baseY,
          hp,
          maxHp: hp,
          root,
          energyFill,
          defeated: false,
          breached: false,
          swayAmplitude: 0.08 + index * 0.035,
          swaySpeed: fastDrop ? 2.4 : 1.55,
          phase: (this.round + panel.teamId * 1.7 + index * 1.2) * Math.PI * 0.45,
          speedMultiplier: fastDrop ? 1.65 : 1.1
        });
      });
    }

    createPickup(panel: PanelView) {
      const team = this.teams[panel.teamId];
      if (!this.isTeamActive(team)) {
        return;
      }
      const usableKinds = pickupKinds.filter((kind) => {
        if (kind === 'soldier') {
          return team.soldiers < 16;
        }
        if (kind === 'heal') {
          return team.hp < team.maxHp || team.soldiers < 16;
        }
        return true;
      });
      const kind = usableKinds[(this.round + panel.teamId * 2) % usableKinds.length];
      const position = ((this.round + panel.teamId + (this.round % 2)) % 3 + 0.5) / 3;
      const pickupSprite = pickupSprites[kind];
      const root = this.add.container(0, 0);
      const glow = this.add.sprite(0, 0, 'projectiles-fx-sheet', 9);
      glow.setScale(Math.max(0.2, Math.min(0.44, panel.rect.width / 1180)));
      glow.setAlpha(0.5);
      const item = this.add.sprite(0, 0, pickupSprite.texture, pickupSprite.frame);
      item.setScale(Math.max(0.25, Math.min(0.5, panel.rect.width / 960)));
      const label = this.add.text(0, -2, pickupLabels[kind], {
        color: '#ffffff',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${Math.max(15, panel.rect.width * 0.03)}px`,
        fontStyle: '950',
        stroke: '#19213a',
        strokeThickness: 5
      }).setOrigin(0.5);
      root.add([glow, item, label]);
      root.setVisible(team.soldiers < 16 || kind !== 'soldier');
      this.worldLayer.add(root);
      panel.pickup = { position, kind, collected: false, root };
      this.updatePickupPosition(panel, 0);
    }

    updateTargetPositions() {
      const progress = clamp(this.roundElapsed / this.roundDuration, 0, 1);
      this.panels.forEach((panel) => {
        panel.targets.forEach((target) => {
          if (target.defeated) {
            return;
          }
          const wave = Math.sin(progress * Math.PI * 2 * target.swaySpeed + target.phase) * target.swayAmplitude;
          const travel = clamp(progress * target.speedMultiplier, 0, 1);
          const y = lerp(target.baseY, this.defenseLineY(panel.rect) + panel.rect.height * 0.01, travel);
          const position = clamp(target.position + wave, 0.09, 0.91);
          const x = this.roadX(panel.rect, position, y);
          const root = target.root as any;
          root.setPosition(x, y);
          root.setScale(this.targetPerspectiveScale(panel.rect, y));
          root.setDepth(Math.floor(y) + 520);
          if (y >= this.defenseLineY(panel.rect) && !target.breached) {
            this.breachTarget(panel, target);
          }
        });
      });
    }

    updateBlockerPositions() {
      const progress = clamp(this.roundElapsed / this.roundDuration, 0, 1);
      this.panels.forEach((panel) => {
        panel.blockers.forEach((blocker) => {
          if (blocker.defeated) {
            return;
          }
          const wave = Math.sin(progress * Math.PI * 2 * blocker.swaySpeed + blocker.phase) * blocker.swayAmplitude;
          const travel = clamp(progress * blocker.speedMultiplier, 0, 1);
          const y = lerp(blocker.baseY, this.defenseLineY(panel.rect) + panel.rect.height * 0.025, travel);
          const position = clamp(blocker.position + wave, 0.12, 0.88);
          const x = this.roadX(panel.rect, position, y);
          const root = blocker.root as any;
          root.setPosition(x, y);
          root.setScale(this.targetPerspectiveScale(panel.rect, y) * 1.1);
          root.setDepth(Math.floor(y) + 760);
          if (progress > 0.9) {
            root.setAlpha(lerp(1, 0.46, (progress - 0.9) / 0.1));
          }
          if (y >= this.defenseLineY(panel.rect) && !blocker.breached) {
            this.breachBlocker(panel, blocker);
          }
        });
      });
    }

    breachTarget(panel: PanelView, target: TargetView) {
      if (target.breached || target.defeated) {
        return;
      }
      const team = this.teams[panel.teamId];
      if (!team) {
        return;
      }
      target.breached = true;
      target.defeated = true;
      const root = target.root as any;
      const damage = target.correct ? 28 : target.elite ? 18 : 12;
      if (!this.isTeamActive(team)) {
        target.breached = true;
        target.defeated = true;
        root.destroy();
        return;
      }
      this.playBaseImpact(panel, root.x, root.y, damage);
      this.applyBaseDamage(panel, team, damage, target.correct ? '정답 악당 침입!' : 'BASE HIT!');
      this.tweens.add({
        targets: root,
        alpha: 0,
        scale: root.scale * 1.18,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => root.destroy()
      });
      if (target.correct) {
        this.resolveTeamMiss(panel, team, '정답 놓침!');
      }
    }

    breachBlocker(panel: PanelView, blocker: BlockerView) {
      if (blocker.breached || blocker.defeated) {
        return;
      }
      const team = this.teams[panel.teamId];
      if (!team) {
        return;
      }
      blocker.breached = true;
      blocker.defeated = true;
      const root = blocker.root as any;
      const damage = blocker.maxHp >= 420 ? 28 : 20;
      if (!this.isTeamActive(team)) {
        root.destroy();
        return;
      }
      this.playBaseImpact(panel, root.x, root.y, damage);
      this.applyBaseDamage(panel, team, damage, '방해몹 충돌!');
      this.tweens.add({
        targets: root,
        alpha: 0,
        scale: root.scale * 1.08,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => root.destroy()
      });
    }

    playBaseImpact(panel: PanelView, x: number, y: number, damage: number) {
      const impact = this.add.sprite(x, Math.max(y, this.defenseLineY(panel.rect)), 'projectiles-fx-sheet', 8);
      impact.setScale(Math.max(0.42, Math.min(0.9, panel.rect.width / 780)));
      impact.setDepth(Math.floor(y) + 980);
      this.fxLayer.add(impact);
      this.tweens.add({
        targets: impact,
        alpha: 0,
        scale: impact.scale * 1.7,
        duration: 380,
        ease: 'Back.easeOut',
        onComplete: () => impact.destroy()
      });
      const text = this.add.text(x, this.defenseLineY(panel.rect) - panel.rect.height * 0.05, `BASE -${damage}`, {
        align: 'center',
        color: '#ffdf7b',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${Math.max(17, panel.rect.width * 0.03)}px`,
        fontStyle: '950',
        stroke: '#3a120c',
        strokeThickness: 5
      }).setOrigin(0.5);
      this.fxLayer.add(text);
      this.tweens.add({
        targets: text,
        y: text.y - 32,
        alpha: 0,
        duration: 520,
        ease: 'Quad.easeOut',
        onComplete: () => text.destroy()
      });
      this.cameras.main.shake(70, 0.002);
    }

    applyBaseDamage(panel: PanelView, team: TeamStatus, damage: number, message: string) {
      if (team.hp <= 0) {
        return;
      }
      if (team.shield > 0) {
        team.shield -= 1;
        this.setPanelVerdict(panel, 'SHIELD BLOCK!');
        this.refreshPanelStats(team.id);
        callbacks.onStats(cloneTeams(this.teams));
        return;
      }
      team.hp = Math.max(0, team.hp - damage);
      team.combo = 0;
      team.score = Math.max(0, team.score - Math.floor(damage * 1.8));
      this.setPanelVerdict(panel, team.hp <= 0 ? 'BASE DOWN!' : message);
      this.refreshPanelStats(team.id);
      callbacks.onStats(cloneTeams(this.teams));
      if (team.hp <= 0) {
        this.disableTeamPanel(panel, team, 'BASE DOWN!');
        this.resolveTeamMiss(panel, team, 'BASE DOWN!');
        this.scheduleNextRound();
      }
    }

    updatePickupPositions() {
      const progress = clamp(this.roundElapsed / this.roundDuration, 0, 1);
      this.panels.forEach((panel) => {
        this.updatePickupPosition(panel, progress);
        const pickup = panel.pickup;
        const team = this.teams[panel.teamId];
        if (!pickup || pickup.collected || !this.isTeamActive(team)) {
          return;
        }
        this.tryCollectPickup(panel, team);
        if (progress >= 0.96 && !pickup.collected) {
          (pickup.root as any).setAlpha(0.35);
        }
      });
    }

    updatePickupPosition(panel: PanelView, progress: number) {
      if (!panel.pickup || panel.pickup.collected) {
        return;
      }
      const travel = this.pickupTravelProgress(progress);
      const y = lerp(panel.rect.y + panel.rect.height * 0.48, panel.rect.y + panel.rect.height * 0.88, travel);
      const team = this.teams[panel.teamId];
      const naturalX = this.roadX(panel.rect, panel.pickup.position, y);
      const teamX = team && team.magnetPower > 0 && travel > 0.24 ? this.roadX(panel.rect, team.position, y) : naturalX;
      const x = team && team.magnetPower > 0 && travel > 0.24 ? lerp(naturalX, teamX, 0.56) : naturalX;
      const root = panel.pickup.root as any;
      root.setPosition(x, y);
      root.setScale(this.pickupPerspectiveScale(panel.rect, y));
      root.setDepth(Math.floor(y) + 430);
    }

    tryCollectPickup(panel: PanelView, team: TeamStatus) {
      const pickup = panel.pickup;
      if (!pickup || pickup.collected || !this.isTeamActive(team)) {
        return;
      }
      if (this.isPickupTouchingTeam(panel, team, pickup)) {
        this.collectPickup(panel, team, pickup);
      }
    }

    isPickupTouchingTeam(panel: PanelView, team: TeamStatus, pickup: PickupView) {
      const root = pickup.root as any;
      if (root.visible === false || Number(root.alpha ?? 1) <= 0.05) {
        return false;
      }
      const pickupX = Number(root.x ?? 0);
      const pickupY = Number(root.y ?? 0);
      const pickupDepth = this.roadDepth(panel.rect, pickupY);
      const baseY = panel.rect.y + panel.rect.height * 0.82;
      const magnetBoost = team.magnetPower > 0 || pickup.kind === 'magnet';
      const pickupRoadPosition = this.roadPositionFromX(panel.rect, pickupX, pickupY);
      const troopFrontY = panel.rect.y + panel.rect.height * 0.765;
      const troopBackY = panel.rect.y + panel.rect.height * 0.91;
      const roadCatchWidth = lerp(0.095, 0.15, pickupDepth) + (magnetBoost ? 0.16 : 0);
      const roadCatchHeight = panel.rect.height * (magnetBoost ? 0.2 : 0.095);
      const inTroopBand = pickupY >= troopFrontY - roadCatchHeight && pickupY <= troopBackY + roadCatchHeight;
      if (inTroopBand && Math.abs(pickupRoadPosition - team.position) <= roadCatchWidth) {
        return true;
      }

      const pickupRadiusX = Math.max(56, panel.rect.width * lerp(0.06, 0.105, pickupDepth)) * (magnetBoost ? 1.95 : 1);
      const pickupRadiusY = Math.max(52, panel.rect.height * lerp(0.052, 0.09, pickupDepth)) * (magnetBoost ? 1.85 : 1);
      return panel.soldiers.some((soldier) => {
        const soldierRoot = soldier.root as any;
        const soldierX = Number(soldierRoot.x ?? this.roadX(panel.rect, team.position, baseY));
        const soldierY = Number(soldierRoot.y ?? baseY);
        const soldierDepth = this.roadDepth(panel.rect, soldierY);
        const soldierRadiusX = Math.max(34, panel.rect.width * lerp(0.032, 0.052, soldierDepth));
        const soldierRadiusY = Math.max(34, panel.rect.height * lerp(0.034, 0.058, soldierDepth));
        const dx = (pickupX - soldierX) / (pickupRadiusX + soldierRadiusX);
        const dy = (pickupY - soldierY) / (pickupRadiusY + soldierRadiusY);
        return dx * dx + dy * dy <= 1;
      });
    }

    collectPickup(panel: PanelView, team: TeamStatus, pickup: PickupView) {
      pickup.collected = true;
      if (pickup.kind !== 'magnet' && team.magnetPower > 0) {
        team.magnetPower = Math.max(0, team.magnetPower - 1);
      }
      this.applyPickupEffect(panel, team, pickup.kind);
      team.score += 35;
      this.refreshPanelStats(team.id);
      this.syncSoldiers(panel, team, true);
      const root = pickup.root as any;
      this.tweens.add({
        targets: root,
        alpha: 0,
        scale: 1.55,
        y: root.y - panel.rect.height * 0.08,
        duration: 420,
        ease: 'Back.easeOut',
        onComplete: () => root.destroy()
      });
      callbacks.onStats(cloneTeams(this.teams));
    }

    applyPickupEffect(panel: PanelView, team: TeamStatus, kind: PickupKind) {
      switch (kind) {
        case 'rapid':
          team.rapidUntil = Math.max(team.rapidUntil, this.roundElapsed + 5200);
          this.setPanelVerdict(panel, 'RAPID FIRE!');
          break;
        case 'multi':
          team.spreadUntil = Math.max(team.spreadUntil, this.roundElapsed + 5200);
          team.weaponLevel = Math.min(5, team.weaponLevel + 1);
          this.setPanelVerdict(panel, 'TRIPLE SHOT!');
          break;
        case 'soldier':
          team.soldiers = Math.min(16, team.soldiers + 2);
          this.setPanelVerdict(panel, '+2 JOIN!');
          break;
        case 'shield':
          team.shield = Math.min(3, team.shield + 1);
          team.hp = Math.min(team.maxHp, team.hp + 10);
          this.setPanelVerdict(panel, 'SHIELD +HP!');
          break;
        case 'rocket':
          team.missileUntil = Math.max(team.missileUntil, this.roundElapsed + 6200);
          team.weaponLevel = Math.min(5, team.weaponLevel + 1);
          this.setPanelVerdict(panel, 'MISSILE RUSH!');
          break;
        case 'freeze':
          this.roundElapsed = Math.max(0, this.roundElapsed - 1800);
          this.setPanelVerdict(panel, 'FREEZE!');
          break;
        case 'heal':
          team.hp = Math.min(team.maxHp, team.hp + 30);
          team.soldiers = Math.min(16, team.soldiers + 1);
          this.setPanelVerdict(panel, 'REPAIR +30!');
          break;
        case 'magnet':
          team.magnetPower = Math.min(4, team.magnetPower + 2);
          this.setPanelVerdict(panel, 'MAGNET!');
          break;
        case 'laser':
          team.laserUntil = Math.max(team.laserUntil, this.roundElapsed + 5200);
          this.setPanelVerdict(panel, 'LASER!');
          break;
        case 'drone':
          team.soldiers = Math.min(16, team.soldiers + 1);
          team.rapidUntil = Math.max(team.rapidUntil, this.roundElapsed + 3600);
          this.setPanelVerdict(panel, 'DRONE JOIN!');
          break;
        case 'bomb':
          this.blastTargets(panel, team, 34 + team.weaponLevel * 8);
          this.setPanelVerdict(panel, 'BLAST!');
          break;
        case 'overdrive':
          team.weaponLevel = Math.min(5, team.weaponLevel + 1);
          team.missileUntil = Math.max(team.missileUntil, this.roundElapsed + 6200);
          team.laserUntil = Math.max(team.laserUntil, this.roundElapsed + 3600);
          team.spreadUntil = Math.max(team.spreadUntil, this.roundElapsed + 4200);
          team.rapidUntil = Math.max(team.rapidUntil, this.roundElapsed + 3200);
          this.setPanelVerdict(panel, 'OVERDRIVE!');
          break;
      }
    }

    blastTargets(panel: PanelView, team: TeamStatus, damage: number) {
      if (!this.isTeamActive(team)) {
        return;
      }
      panel.blockers
        .filter((blocker) => !blocker.defeated)
        .forEach((blocker, index) => {
          this.time.delayedCall(index * 45, () => this.hitBlocker(panel, team, blocker, Math.floor(damage * 1.35)));
        });
      panel.targets
        .filter((target) => !target.defeated)
        .forEach((target, index) => {
          this.time.delayedCall(index * 55 + 80, () => this.hitTarget(panel, team, target, damage));
        });

      const burst = this.add.sprite(
        panel.rect.x + panel.rect.width * 0.5,
        panel.rect.y + panel.rect.height * 0.55,
        'projectiles-fx-sheet',
        8
      );
      burst.setScale(Math.max(0.65, Math.min(1.4, panel.rect.width / 720)));
      burst.setAlpha(0.78);
      this.fxLayer.add(burst);
      this.tweens.add({
        targets: burst,
        alpha: 0,
        scale: burst.scale * 1.65,
        duration: 420,
        ease: 'Back.easeOut',
        onComplete: () => burst.destroy()
      });
      this.cameras.main.shake(55, 0.0016);
    }

    shootAllTeams() {
      this.teams.forEach((team) => {
        if (!this.isTeamActive(team) || this.resolvedTeams.has(team.id)) {
          return;
        }
        const panel = this.panels[team.id];
        if (!panel) {
          return;
        }
        panel.soldiers.forEach((soldier, index) => {
          const offsets = team.spreadUntil > this.roundElapsed ? [-0.045, 0, 0.045] : [0];
          offsets.forEach((offset, offsetIndex) => {
            this.time.delayedCall(index * 22 + offsetIndex * 12, () => this.fireSoldierBullet(panel, team, soldier, offset));
          });
          if (team.rapidUntil > this.roundElapsed) {
            this.time.delayedCall(index * 22 + 86, () => this.fireSoldierBullet(panel, team, soldier, 0));
          }
          if (team.laserUntil > this.roundElapsed) {
            this.time.delayedCall(index * 22 + 46, () => this.fireSoldierBullet(panel, team, soldier, 0.018));
          }
        });
      });
    }

    fireSoldierBullet(panel: PanelView, team: TeamStatus, soldier: SoldierView, roadOffset = 0) {
      if (this.phase !== 'running' || !this.isTeamActive(team) || this.resolvedTeams.has(team.id)) {
        return;
      }
      const root = soldier.root as any;
      const laserActive = team.laserUntil > this.roundElapsed;
      const missileBoost = team.missileUntil > this.roundElapsed || team.weaponLevel >= 3;
      const bulletTexture = laserActive ? 'projectiles-fx-sheet' : 'runner-atlas-v2';
      const bulletFrame = laserActive ? 2 : 13;
      const launchY = root.y - 22;
      const launchPosition = clamp(this.roadPositionFromX(panel.rect, root.x + 10, launchY) + roadOffset, 0.04, 0.96);
      const launchX = this.roadX(panel.rect, launchPosition, launchY);
      const bullet = this.add.sprite(launchX, launchY, bulletTexture, bulletFrame);
      const scaleBase = Math.max(0.1, Math.min(0.23, panel.rect.width / 2100)) * (laserActive ? 1.3 : missileBoost ? 1.45 : 1.16);
      bullet.setScale(scaleBase * this.projectilePerspectiveScale(panel.rect, launchY));
      bullet.setAlpha(0.95);
      bullet.rotation = -Math.PI / 2;
      bullet.setDepth(Math.floor(launchY) + 900);
      this.fxLayer.add(bullet);
      this.projectiles.push({
        root: bullet,
        panelId: panel.teamId,
        teamId: team.id,
        damage: this.projectileDamage(team, laserActive, missileBoost),
        position: launchPosition,
        speed: 0.78 + team.weaponLevel * 0.035 + (laserActive ? 0.14 : missileBoost ? 0.06 : 0),
        scaleBase,
        alive: true
      });
      this.tweens.add({
        targets: root,
        y: root.y + 3,
        duration: 45,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }

    applyProjectilePerspective(panel: PanelView, projectile: ProjectileView, y: number) {
      const bullet = projectile.root as any;
      const previousX = bullet.x ?? this.roadX(panel.rect, projectile.position, y);
      const previousY = bullet.y ?? y;
      const x = this.roadX(panel.rect, projectile.position, y);
      bullet.setPosition(x, y);
      bullet.setScale(projectile.scaleBase * this.projectilePerspectiveScale(panel.rect, y));
      bullet.setDepth(Math.floor(y) + 900);
      const dx = x - previousX;
      const dy = y - previousY;
      if (Math.abs(dx) + Math.abs(dy) > 0.001) {
        const lean = clamp(dx / (Math.abs(dy) + 1), -0.36, 0.36);
        bullet.rotation = -Math.PI / 2 + lean;
      }
    }

    updateProjectiles(delta: number) {
      this.projectiles = this.projectiles.filter((projectile) => {
        const bullet = projectile.root as any;
        const panel = this.panels[projectile.panelId];
        const team = this.teams[projectile.teamId];
        if (!projectile.alive || !panel || !this.isTeamActive(team) || this.resolvedTeams.has(projectile.teamId)) {
          bullet?.destroy();
          return false;
        }

        const ceilingY = this.projectileCeilingY(panel.rect);
        const nextY = Math.max(ceilingY, bullet.y - projectile.speed * delta);
        this.applyProjectilePerspective(panel, projectile, nextY);
        const blocker = this.findProjectileBlockerHit(panel, bullet);
        if (blocker) {
          projectile.alive = false;
          bullet.destroy();
          this.hitBlocker(panel, team, blocker, projectile.damage);
          return false;
        }

        const target = this.findProjectileHit(panel, bullet);
        if (target) {
          projectile.alive = false;
          bullet.destroy();
          this.hitTarget(panel, team, target, projectile.damage);
          return false;
        }

        if (bullet.y <= ceilingY) {
          bullet.destroy();
          return false;
        }
        return true;
      });
    }

    findProjectileBlockerHit(panel: PanelView, bullet: { x: number; y: number }) {
      const hitWidth = Math.max(52, panel.rect.width * 0.075);
      const hitTop = panel.rect.height * 0.17;
      const hitBottom = panel.rect.height * 0.14;
      return panel.blockers
        .filter((blocker) => {
          if (blocker.defeated) {
            return false;
          }
          const root = blocker.root as any;
          const scale = Math.max(0.9, Number(root.scaleX ?? 1));
          return Math.abs(bullet.x - root.x) <= hitWidth * scale && bullet.y >= root.y - hitTop * scale && bullet.y <= root.y + hitBottom * scale;
        })
        .sort((a, b) => Math.abs(((a.root as any).y ?? 0) - bullet.y) - Math.abs(((b.root as any).y ?? 0) - bullet.y))[0];
    }

    findProjectileHit(panel: PanelView, bullet: { x: number; y: number }) {
      const hitWidth = Math.max(28, panel.rect.width * 0.04);
      const hitTop = panel.rect.height * 0.13;
      const hitBottom = panel.rect.height * 0.1;
      return panel.targets
        .filter((target) => {
          if (target.defeated) {
            return false;
          }
          const root = target.root as any;
          const scale = Math.max(0.76, Number(root.scaleX ?? 1));
          return Math.abs(bullet.x - root.x) <= hitWidth * scale && bullet.y >= root.y - hitTop * scale && bullet.y <= root.y + hitBottom * scale;
        })
        .sort((a, b) => Math.abs(((a.root as any).y ?? 0) - bullet.y) - Math.abs(((b.root as any).y ?? 0) - bullet.y))[0];
    }

    hitBlocker(panel: PanelView, team: TeamStatus, blocker: BlockerView, damage: number) {
      if (blocker.defeated || !this.isTeamActive(team)) {
        return;
      }
      const root = blocker.root as any;
      const energyFill = blocker.energyFill as any;
      const blockerScale = Math.max(0.88, Number(root.scaleX ?? 1));
      blocker.hp = Math.max(0, blocker.hp - damage);
      energyFill.setScale(Math.max(0.02, blocker.hp / blocker.maxHp), 1);

      const spark = this.add.sprite(root.x, root.y + 8, 'projectiles-fx-sheet', 4);
      spark.setScale(Math.max(0.28, Math.min(0.58, panel.rect.width / 900)) * blockerScale);
      spark.setAlpha(0.88);
      this.fxLayer.add(spark);
      this.tweens.add({
        targets: spark,
        alpha: 0,
        scale: spark.scale * 1.55,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });

      this.tweens.add({
        targets: root,
        x: root.x + (Math.random() > 0.5 ? 7 : -7),
        duration: 42,
        yoyo: true,
        repeat: 1
      });

      if (blocker.hp <= 0) {
        this.destroyBlocker(panel, team, blocker);
      }
    }

    destroyBlocker(panel: PanelView, team: TeamStatus, blocker: BlockerView) {
      if (!this.isTeamActive(team)) {
        return;
      }
      blocker.defeated = true;
      const root = blocker.root as any;
      const blockerScale = Math.max(0.88, Number(root.scaleX ?? 1));
      const boom = this.add.sprite(root.x, root.y, 'projectiles-fx-sheet', 8);
      boom.setScale(Math.max(0.48, Math.min(0.92, panel.rect.width / 650)) * blockerScale);
      this.fxLayer.add(boom);
      this.tweens.add({
        targets: boom,
        alpha: 0,
        scale: boom.scale * 1.75,
        duration: 520,
        ease: 'Back.easeOut',
        onComplete: () => boom.destroy()
      });
      this.tweens.add({
        targets: root,
        alpha: 0,
        scale: root.scale * 0.72,
        duration: 220,
        onComplete: () => root.destroy()
      });
      team.score += 45;
      this.refreshPanelStats(team.id);
      callbacks.onStats(cloneTeams(this.teams));
      this.cameras.main.shake(46, 0.0014);
    }

    updateBossHud() {
      this.panels.forEach((panel) => {
        const bossHpText = panel.bossHpText as any;
        if (this.round >= this.bossStartRound) {
          bossHpText.setText(`HP ${Math.max(0, this.bossHp)} / ${this.bossMaxHp}`);
        }
      });
      if (this.problem) {
        callbacks.onRound({
          number: this.round,
          mode: this.round >= this.bossStartRound ? 'boss' : 'targets',
          problem: this.problem,
          bossHp: this.bossHp,
          bossMaxHp: this.bossMaxHp,
          message: this.round >= this.bossStartRound ? '정답 악당 타격으로 보스 HP 감소' : '배 숫자 정답 찾기'
        });
      }
    }

    damageBoss(panel: PanelView, damage: number) {
      if (this.round < this.bossStartRound || this.bossHp <= 0) {
        return;
      }
      this.bossHp = Math.max(0, this.bossHp - damage);
      this.updateBossHud();
      const boss = panel.boss as any;
      this.tweens.add({
        targets: boss,
        scale: boss.scale * 1.08,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
      if (this.bossHp <= 0) {
        this.setPanelVerdict(panel, 'BOSS DOWN!');
        this.cameras.main.shake(120, 0.0032);
      }
    }

    hitTarget(panel: PanelView, team: TeamStatus, target: TargetView, damage: number) {
      if (target.defeated || !this.isTeamActive(team)) {
        return;
      }
      const root = target.root as any;
      const energyFill = target.energyFill as any;
      const targetScale = Math.max(0.72, Number(root.scaleX ?? 1));
      target.hp = Math.max(0, target.hp - damage);
      energyFill.setScale(Math.max(0.02, target.hp / target.maxHp), 1);
      const bossMode = this.round >= this.bossStartRound;
      if (bossMode && target.correct) {
        this.damageBoss(panel, Math.max(1, Math.floor(damage * 0.9)));
        if (this.bossHp <= 0) {
          target.hp = 0;
          energyFill.setScale(0.02, 1);
        }
      }
      const damageText = this.add.text(root.x, root.y - 116 * targetScale, `-${damage}`, {
        color: '#fff5a8',
        fontFamily: 'Apple SD Gothic Neo, Noto Sans KR, Arial',
        fontSize: `${Math.max(14, panel.rect.width * 0.026)}px`,
        fontStyle: '950',
        stroke: '#3a160c',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.fxLayer.add(damageText);
      this.tweens.add({
        targets: damageText,
        y: damageText.y - 26,
        alpha: 0,
        duration: 360,
        ease: 'Quad.easeOut',
        onComplete: () => damageText.destroy()
      });
      const spark = this.add.sprite(root.x, root.y + 12, 'projectiles-fx-sheet', 4);
      spark.setScale(Math.max(0.18, Math.min(0.38, panel.rect.width / 1240)) * targetScale);
      spark.setAlpha(0.9);
      this.fxLayer.add(spark);
      this.tweens.add({
        targets: spark,
        alpha: 0,
        scale: spark.scale * 1.7,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
      this.tweens.add({
        targets: root,
        x: root.x + (Math.random() > 0.5 ? 5 : -5),
        duration: 38,
        yoyo: true,
        repeat: 1
      });
      if (target.correct) {
        this.cameras.main.shake(34, 0.0012);
      }
      if (target.hp <= 0) {
        this.destroyTarget(panel, team, target);
      }
    }

    destroyTarget(panel: PanelView, team: TeamStatus, target: TargetView) {
      target.defeated = true;
      const root = target.root as any;
      const targetScale = Math.max(0.72, Number(root.scaleX ?? 1));
      const boom = this.add.sprite(root.x, root.y, 'projectiles-fx-sheet', 8);
      boom.setScale(Math.max(0.34, Math.min(0.68, panel.rect.width / 860)) * targetScale);
      this.fxLayer.add(boom);
      this.tweens.add({
        targets: boom,
        alpha: 0,
        scale: boom.scale * 1.75,
        duration: 480,
        ease: 'Back.easeOut',
        onComplete: () => boom.destroy()
      });
      this.tweens.add({
        targets: root,
        alpha: 0,
        scale: 0.64,
        duration: 180,
        onComplete: () => root.destroy()
      });
      if (target.correct) {
        this.resolveTeamSuccess(panel, team);
      }
    }

    resolveTeamSuccess(panel: PanelView, team: TeamStatus) {
      if (!this.problem || !this.isTeamActive(team) || this.resolvedTeams.has(team.id)) {
        return;
      }
      const bossMode = this.round >= this.bossStartRound;
      this.resolvedTeams.add(team.id);
      team.attempts += 1;
      team.correct += 1;
      team.combo += 1;
      team.maxCombo = Math.max(team.maxCombo, team.combo);
      team.score += 160 + team.combo * 35 + team.soldiers * 12;
      if (team.combo > 0 && team.combo % 3 === 0) {
        team.weaponLevel = Math.min(5, team.weaponLevel + 1);
      }
      this.setPanelVerdict(panel, team.combo >= 2 ? `${team.combo} COMBO!` : '정답 파괴!');
      this.refreshPanelStats(team.id);
      callbacks.onStats(cloneTeams(this.teams));
      callbacks.onRound({
        number: this.round,
        mode: bossMode ? 'boss' : 'targets',
        problem: this.problem,
        bossHp: this.bossHp,
        bossMaxHp: this.bossMaxHp,
        message: bossMode ? '배 숫자 정답 보스 격파' : '배 숫자 정답 찾기'
      });
      this.scheduleNextRound();
    }

    resolveTeamMiss(panel: PanelView, team: TeamStatus, message: string) {
      if (!this.problem || this.resolvedTeams.has(team.id)) {
        return;
      }
      const bossMode = this.round >= this.bossStartRound;
      this.resolvedTeams.add(team.id);
      team.attempts += 1;
      team.combo = 0;
      team.score = Math.max(0, team.score - 25);
      this.setPanelVerdict(panel, message);
      this.refreshPanelStats(team.id);
      callbacks.onStats(cloneTeams(this.teams));
      callbacks.onRound({
        number: this.round,
        mode: bossMode ? 'boss' : 'targets',
        problem: this.problem,
        bossHp: this.bossHp,
        bossMaxHp: this.bossMaxHp,
        message: bossMode ? '보스 공격 방어 실패' : '방어선 피해'
      });
      this.scheduleNextRound();
    }

    resolveMissedTeams() {
      this.teams.forEach((team) => {
        if (!this.isTeamActive(team) || this.resolvedTeams.has(team.id)) {
          return;
        }
        const panel = this.panels[team.id];
        if (!panel) {
          return;
        }
        const liveCorrectTarget = panel.targets.find((target) => target.correct && !target.defeated && !target.breached);
        const fallbackX = panel.rect.x + panel.rect.width * 0.5;
        const impactX = liveCorrectTarget ? (liveCorrectTarget.root as any).x : fallbackX;
        this.playBaseImpact(panel, impactX, this.defenseLineY(panel.rect), 12);
        this.applyBaseDamage(panel, team, 12, '시간 초과!');
        this.resolveTeamMiss(panel, team, '놓쳤다!');
        this.syncSoldiers(panel, team, true);
        this.refreshPanelStats(team.id);
      });
      callbacks.onStats(cloneTeams(this.teams));
    }

    scheduleNextRound() {
      if (this.phase !== 'running') {
        return;
      }
      if (this.allBasesDown()) {
        this.phase = 'between';
        this.time.delayedCall(520, () => {
          if (this.phase === 'between') {
            this.finishGame();
          }
        });
        return;
      }
      if (this.resolvedTeams.size < this.teams.length) {
        return;
      }
      this.phase = 'between';
      this.time.delayedCall(980, () => {
        if (this.phase !== 'between') {
          return;
        }
        if (this.bossHp <= 0 || this.round >= this.maxRounds) {
          this.finishGame();
        } else {
          this.startRound();
        }
      });
    }

    setPanelVerdict(panel: PanelView, text: string) {
      const verdict = panel.verdict as any;
      verdict.setText(text);
      verdict.setAlpha(text ? 1 : 0);
      verdict.setScale(0.86);
      if (text) {
        this.tweens.add({
          targets: verdict,
          scale: 1,
          alpha: 0,
          delay: 500,
          duration: 520,
          ease: 'Back.easeOut'
        });
      }
    }

    createSoldierView(team: TeamStatus) {
      const root = this.add.container(0, 0);
      const shadow = this.add.ellipse(0, 27, 74, 18, 0x0b1020, 0.24);
      const sprite = this.add.sprite(0, -12, 'hero-run-shoot-sheet-v1', team.id * actionFrameCount);
      sprite.setScale(0.36);
      sprite.play(`hero-run-shoot-${team.id}`);
      root.add([shadow, sprite]);
      this.worldLayer.add(root);
      return { root };
    }

    syncSoldiers(panel: PanelView, team: TeamStatus, animate: boolean) {
      while (panel.soldiers.length < team.soldiers) {
        panel.soldiers.push(this.createSoldierView(team));
      }
      while (panel.soldiers.length > team.soldiers) {
        const soldier = panel.soldiers.pop();
        if (soldier) {
          (soldier.root as any).destroy();
        }
      }
      const positions = this.getSoldierPositions(panel, team);
      panel.soldiers.forEach((soldier, index) => {
        const root = soldier.root as any;
        const position = positions[index];
        const scale = Math.max(0.66, Math.min(1.15, panel.rect.width / 960));
        root.setScale(scale);
        if (animate) {
          this.tweens.add({
            targets: root,
            x: position.x,
            y: position.y,
            duration: 190,
            ease: 'Back.easeOut'
          });
        } else {
          root.setPosition(position.x, position.y);
        }
      });
      this.drawLaneGlow(panel, team);
    }

    getSoldierPositions(panel: PanelView, team: TeamStatus) {
      const baseY = panel.rect.y + panel.rect.height * 0.82;
      const centerX = this.roadX(panel.rect, team.position, baseY);
      const count = team.soldiers;
      const rowSize = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(count + 1))));
      const gapX = Math.max(22, panel.rect.width * 0.038);
      const gapY = Math.max(24, panel.rect.height * 0.048);
      return Array.from({ length: count }, (_, index) => {
        const row = Math.floor(index / rowSize);
        const col = index % rowSize;
        const itemsInRow = Math.min(rowSize, count - row * rowSize);
        return {
          x: centerX + (col - (itemsInRow - 1) / 2) * gapX,
          y: baseY + row * gapY - Math.floor(count / 5) * gapY * 0.45
        };
      });
    }

    drawLaneGlow(panel: PanelView, team: TeamStatus) {
      const glow = panel.laneGlow as any;
      const baseY = panel.rect.y + panel.rect.height * 0.84;
      const x = this.roadX(panel.rect, team.position, baseY);
      glow.clear();
      glow.fillStyle(teamPalette[team.color].main, 0.24);
      glow.fillEllipse(x, baseY + 8, panel.rect.width * 0.18, panel.rect.height * 0.08);
      glow.lineStyle(2, 0xffffff, 0.22);
      glow.strokeEllipse(x, baseY + 8, panel.rect.width * 0.18, panel.rect.height * 0.08);
    }

    refreshPanelStats(teamId: number) {
      const team = this.teams[teamId];
      const panel = this.panels[teamId];
      if (!team || !panel) {
        return;
      }

      const statLabel = panel.statLabel as any;
      const boosts = [
        team.missileUntil > this.roundElapsed ? '미사일' : '',
        team.laserUntil > this.roundElapsed ? '레이저' : '',
        team.rapidUntil > this.roundElapsed ? '연사' : '',
        team.spreadUntil > this.roundElapsed ? '3WAY' : '',
        team.magnetPower > 0 ? '자석' : ''
      ].filter(Boolean).slice(0, 2).join(' ');
      statLabel.setText(team.hp <= 0
        ? `${team.score}점  BASE DOWN`
        : `${team.score}점  HP ${team.hp}/${team.maxHp}  인원 ${team.soldiers}  Lv.${team.weaponLevel}${boosts ? `  ${boosts}` : ''}`);
      const hpRatio = clamp(team.hp / team.maxHp, 0, 1);
      const baseHpFill = panel.baseHpFill as any;
      const baseHpText = panel.baseHpText as any;
      baseHpFill.setScale(hpRatio <= 0 ? 0 : Math.max(0.02, hpRatio), 1);
      baseHpFill.setFillStyle(hpRatio > 0.55 ? 0x5ff27a : hpRatio > 0.25 ? 0xffd75f : 0xff5d57, 1);
      baseHpText.setText(team.hp <= 0 ? 'BASE DOWN' : `BASE HP ${team.hp} / ${team.maxHp}`);
      const bossHpText = panel.bossHpText as any;
      if (this.round >= this.bossStartRound) {
        bossHpText.setText(`HP ${Math.max(0, this.bossHp)} / ${this.bossMaxHp}`);
      }
    }

    updateContinuousMovement(delta: number) {
      this.teams.forEach((team) => {
        if (!this.isTeamActive(team)) {
          return;
        }
        const keyboardDirection = this.getKeyboardDirection(team.id);
        const holdDirection = this.inputDirections[team.id] ?? 0;
        const direction = holdDirection || keyboardDirection;
        if (direction === 0) {
          return;
        }

        const speed = 0.00064 + team.weaponLevel * 0.000025;
        this.setTeamPosition(team.id, team.position + direction * speed * delta, false, false);
      });
    }

    getKeyboardDirection(teamId: number) {
      const keyPairs = [
        ['p1Left', 'p1Right', 'p1AltLeft', 'p1AltRight'],
        ['p2Left', 'p2Right'],
        ['p3Left', 'p3Right'],
        ['p4Left', 'p4Right']
      ];
      const keys = keyPairs[teamId] ?? [];
      const leftPressed = keys
        .filter((key) => key.toLowerCase().includes('left'))
        .some((key) => this.inputKeys[key]?.isDown);
      const rightPressed = keys
        .filter((key) => key.toLowerCase().includes('right'))
        .some((key) => this.inputKeys[key]?.isDown);
      if (leftPressed === rightPressed) {
        return 0;
      }
      return leftPressed ? -1 : 1;
    }

    setTeamDirection(teamId: number, direction: -1 | 0 | 1) {
      const team = this.teams[teamId];
      if (!this.isTeamActive(team)) {
        this.inputDirections[teamId] = 0;
        return;
      }
      this.inputDirections[teamId] = direction;
    }

    setTeamPositionFromPointer(panel: PanelView, x: number, pushStats: boolean) {
      const baseY = panel.rect.y + panel.rect.height * 0.82;
      const edges = this.roadEdges(panel.rect, baseY);
      const position = (x - edges.left) / (edges.right - edges.left);
      this.setTeamPosition(panel.teamId, position, false, pushStats);
    }

    moveTeam(teamId: number, delta: -1 | 1) {
      const team = this.teams[teamId];
      if (!this.isTeamActive(team)) {
        return;
      }
      this.setTeamPosition(teamId, team.position + delta * 0.085, true, true);
    }

    setTeamPosition(teamId: number, position: number, animate: boolean, pushStats: boolean) {
      const team = this.teams[teamId];
      const panel = this.panels[teamId];
      if (!this.isTeamActive(team) || !panel) {
        return;
      }

      const nextPosition = clamp(position, 0.055, 0.945);
      if (Math.abs(nextPosition - team.position) < 0.001) {
        return;
      }
      team.position = nextPosition;
      team.lane = nearestLane(nextPosition);
      this.syncSoldiers(panel, team, animate);
      if (this.phase !== 'loading' && this.phase !== 'finished') {
        this.tryCollectPickup(panel, team);
      }
      this.movementDirty = true;
      if (pushStats) {
        callbacks.onStats(cloneTeams(this.teams));
      }
    }

    finishGame() {
      this.phase = 'finished';
      const teams = cloneTeams(this.teams);
      callbacks.onFinish({
        teams,
        winners: rankTeams(teams),
        bossDefeated: this.bossHp <= 0,
        totalRounds: this.round
      });
    }
  }

  config.scene = [RushScene];
  return new Phaser.Game(config);
}

function getPanelRects(width: number, height: number, count: number): Rect[] {
  const gap = 14;
  const pad = 14;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;

  if (count === 1) {
    return [{ x: pad, y: pad, width: usableWidth, height: usableHeight }];
  }

  if (count === 2) {
    const panelWidth = (usableWidth - gap) / 2;
    return [0, 1].map((index) => ({
      x: pad + index * (panelWidth + gap),
      y: pad,
      width: panelWidth,
      height: usableHeight
    }));
  }

  if (count === 3) {
    const panelWidth = (usableWidth - gap * 2) / 3;
    return [0, 1, 2].map((index) => ({
      x: pad + index * (panelWidth + gap),
      y: pad,
      width: panelWidth,
      height: usableHeight
    }));
  }

  const wideBoard = width / height > 1.7 && width > 1260;
  if (wideBoard) {
    const panelWidth = (usableWidth - gap * 3) / 4;
    return [0, 1, 2, 3].map((index) => ({
      x: pad + index * (panelWidth + gap),
      y: pad,
      width: panelWidth,
      height: usableHeight
    }));
  }

  const panelWidth = (usableWidth - gap) / 2;
  const panelHeight = (usableHeight - gap) / 2;
  return [0, 1, 2, 3].map((index) => ({
    x: pad + (index % 2) * (panelWidth + gap),
    y: pad + Math.floor(index / 2) * (panelHeight + gap),
    width: panelWidth,
    height: panelHeight
  }));
}
