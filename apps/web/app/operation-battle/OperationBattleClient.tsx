'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './operation-battle.module.css';

type TeamId = 'blue' | 'red';
type Phase = 'ready' | 'playing' | 'paused' | 'ended';
type Reaction = 'ready' | 'cheer' | 'wrong' | 'boost' | 'victory' | 'tug';
type EventKind = 'correct' | 'wrong' | 'reset';

type Problem = {
  prompt: string;
  answer: number;
};

type TeamState = {
  id: TeamId;
  name: string;
  score: number;
  combo: number;
  bestCombo: number;
  correct: number;
  wrong: number;
  input: string;
  problem: Problem;
  reaction: Reaction;
};

type BattleEvent = {
  id: number;
  team: TeamId;
  kind: EventKind;
  message: string;
  pullSide: TeamId | null;
};

type FrozenKey = {
  id: number;
  digit: number;
  expiresAt: number;
};

type IceShot = {
  id: number;
  from: TeamId;
};

type GameState = {
  phase: Phase;
  timeLeft: number;
  round: number;
  meter: number;
  teams: Record<TeamId, TeamState>;
  items: Record<TeamId, number>;
  frozenKeys: Record<TeamId, Record<string, FrozenKey>>;
  lastEvent: BattleEvent;
};

const ASSET_ROOT = '/operation-battle/assets';
const ICE_ASSET = `${ASSET_ROOT}/items/ice.png?v=1`;
const MAX_METER = 8;
const DEFAULT_GAME_SECONDS = 90;
const INTRO_DURATION_MS = 3900;
const PROBLEM_POOL_SIZE = 200;
const INITIAL_ITEM_COUNT = 2;
const ICE_FREEZE_MS = 10000;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const TIME_PRESETS = [30, 60, 90, 120, 180];

const teamConfig: Record<TeamId, { css: string; side: string; card: string }> = {
  blue: {
    css: '#2f8cf3',
    side: '왼쪽',
    card: `${ASSET_ROOT}/ui/blue_card_centered.png`
  },
  red: {
    css: '#ff5b5b',
    side: '오른쪽',
    card: `${ASSET_ROOT}/ui/red_card_centered.png`
  }
};

const characterSprites: Record<TeamId, Record<Reaction, string>> = {
  blue: {
    ready: `${ASSET_ROOT}/characters/sprites/blue_idle_cheer.png?v=state-sprites-1`,
    cheer: `${ASSET_ROOT}/characters/sprites/blue_correct_happy.png?v=state-sprites-1`,
    wrong: `${ASSET_ROOT}/characters/sprites/blue_wrong_sad.png?v=state-sprites-1`,
    boost: `${ASSET_ROOT}/characters/sprites/blue_correct_happy.png?v=state-sprites-1`,
    victory: `${ASSET_ROOT}/characters/sprites/blue_correct_happy.png?v=state-sprites-1`,
    tug: `${ASSET_ROOT}/characters/sprites/blue_wrong_sad.png?v=state-sprites-1`
  },
  red: {
    ready: `${ASSET_ROOT}/characters/sprites/red_idle_cheer.png?v=state-sprites-1`,
    cheer: `${ASSET_ROOT}/characters/sprites/red_correct_happy.png?v=state-sprites-1`,
    wrong: `${ASSET_ROOT}/characters/sprites/red_wrong_sad.png?v=state-sprites-1`,
    boost: `${ASSET_ROOT}/characters/sprites/red_correct_happy.png?v=state-sprites-1`,
    victory: `${ASSET_ROOT}/characters/sprites/red_correct_happy.png?v=state-sprites-1`,
    tug: `${ASSET_ROOT}/characters/sprites/red_wrong_sad.png?v=state-sprites-1`
  }
};

function makeTwoDigitAdditionPool(): Problem[] {
  const problems: Problem[] = [];
  const used = new Set<string>();

  for (let index = 0; problems.length < PROBLEM_POOL_SIZE; index += 1) {
    const a = 10 + ((index * 17 + 23) % 90);
    const b = 10 + ((index * 31 + 41 + Math.floor(index / 90) * 13) % 90);
    const key = `${a}+${b}`;

    if (!used.has(key)) {
      used.add(key);
      problems.push({ prompt: `${a} + ${b}`, answer: a + b });
    }
  }

  return problems;
}

const twoDigitAdditionPool = makeTwoDigitAdditionPool();
const initialBlueProblem = twoDigitAdditionPool[0];
const initialRedProblem = twoDigitAdditionPool[1];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function opponentOf(teamId: TeamId): TeamId {
  return teamId === 'blue' ? 'red' : 'blue';
}

function makeProblem(seed: number): Problem {
  const index = (Math.floor(Math.random() * twoDigitAdditionPool.length) + seed) % twoDigitAdditionPool.length;
  return twoDigitAdditionPool[index];
}

function makeTeam(id: TeamId, name: string, problem: Problem): TeamState {
  return {
    id,
    name,
    score: 0,
    combo: 0,
    bestCombo: 0,
    correct: 0,
    wrong: 0,
    input: '',
    problem,
    reaction: 'ready'
  };
}

function makeInitialGame(duration = DEFAULT_GAME_SECONDS): GameState {
  return {
    phase: 'ready',
    timeLeft: duration,
    round: 1,
    meter: 0,
    teams: {
      blue: makeTeam('blue', '블루팀', initialBlueProblem),
      red: makeTeam('red', '레드팀', initialRedProblem)
    },
    items: {
      blue: INITIAL_ITEM_COUNT,
      red: INITIAL_ITEM_COUNT
    },
    frozenKeys: {
      blue: {},
      red: {}
    },
    lastEvent: {
      id: 0,
      team: 'blue',
      kind: 'reset',
      message: 'READY',
      pullSide: null
    }
  };
}

function winnerOf(game: GameState): TeamId | 'draw' {
  if (game.meter >= MAX_METER) {
    return 'blue';
  }
  if (game.meter <= -MAX_METER) {
    return 'red';
  }
  if (game.teams.blue.score === game.teams.red.score) {
    if (game.meter === 0) {
      return 'draw';
    }
    return game.meter > 0 ? 'blue' : 'red';
  }
  return game.teams.blue.score > game.teams.red.score ? 'blue' : 'red';
}

function reactionFor(team: TeamState, game: GameState): Reaction {
  if (game.phase !== 'ended') {
    return team.reaction;
  }

  const winner = winnerOf(game);
  if (winner === 'draw') {
    return 'boost';
  }
  return winner === team.id ? 'victory' : 'tug';
}

export default function OperationBattleClient() {
  const [game, setGame] = useState<GameState>(() => makeInitialGame());
  const [roundDuration, setRoundDuration] = useState(DEFAULT_GAME_SECONDS);
  const [introDone, setIntroDone] = useState(false);
  const [iceShot, setIceShot] = useState<IceShot | null>(null);
  const scheduledFreezeIds = useRef<Set<number>>(new Set());
  const tugOffset = -(game.meter / MAX_METER) * 148;
  const pullSide = game.lastEvent.pullSide;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIntroDone(true);
    }, INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!introDone || game.phase !== 'playing') {
      return;
    }

    const timer = window.setInterval(() => {
      setGame((current) => {
        if (current.phase !== 'playing') {
          return current;
        }
        const nextTime = Math.max(0, current.timeLeft - 1);
        return {
          ...current,
          phase: nextTime === 0 ? 'ended' : current.phase,
          timeLeft: nextTime
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [game.phase, introDone]);

  useEffect(() => {
    (['blue', 'red'] as const).forEach((teamId) => {
      Object.values(game.frozenKeys[teamId]).forEach((frozen) => {
        if (scheduledFreezeIds.current.has(frozen.id)) {
          return;
        }

        scheduledFreezeIds.current.add(frozen.id);
        const remainingMs = Math.max(0, frozen.expiresAt - Date.now());

        window.setTimeout(() => {
          scheduledFreezeIds.current.delete(frozen.id);
          setGame((current) => {
            const key = String(frozen.digit);
            const currentFrozen = current.frozenKeys[teamId][key];

            if (!currentFrozen || currentFrozen.id !== frozen.id) {
              return current;
            }

            const nextFrozenKeys = { ...current.frozenKeys[teamId] };
            delete nextFrozenKeys[key];

            return {
              ...current,
              frozenKeys: {
                ...current.frozenKeys,
                [teamId]: nextFrozenKeys
              }
            };
          });
        }, remainingMs);
      });
    });
  }, [game.frozenKeys]);

  const startFreshGame = (duration: number): GameState => {
    const seed = Date.now();
    return {
      ...makeInitialGame(duration),
      teams: {
        blue: makeTeam('blue', '블루팀', makeProblem(seed)),
        red: makeTeam('red', '레드팀', makeProblem(seed + 1))
      },
      lastEvent: {
        id: seed,
        team: 'blue',
        kind: 'reset',
        message: 'READY',
        pullSide: null
      }
    };
  };

  const toggleGame = () => {
    if (game.phase === 'ended' || game.timeLeft === 0) {
      setIceShot(null);
      scheduledFreezeIds.current.clear();
      setGame({
        ...startFreshGame(roundDuration),
        phase: 'playing'
      });
      return;
    }

    setGame((current) => {
      if (current.phase === 'playing') {
        return {
          ...current,
          phase: 'paused'
        };
      }

      return {
        ...current,
        phase: 'playing'
      };
    });
  };

  const adjustRoundDuration = () => {
    if (game.phase === 'playing') {
      return;
    }

    const currentIndex = TIME_PRESETS.indexOf(roundDuration);
    const nextDuration = TIME_PRESETS[(currentIndex + 1) % TIME_PRESETS.length];

    setRoundDuration(nextDuration);
    setGame((current) => ({
      ...current,
      phase: current.phase === 'ended' ? 'ready' : current.phase,
      timeLeft: nextDuration
    }));
  };

  const useIceItem = (teamId: TeamId) => {
    if (game.phase !== 'playing' || game.items[teamId] <= 0) {
      return;
    }

    const targetTeam = opponentOf(teamId);
    const availableDigits = DIGITS.filter((digit) => !game.frozenKeys[targetTeam][String(digit)]);

    if (availableDigits.length === 0) {
      return;
    }

    const digit = availableDigits[Math.floor(Math.random() * availableDigits.length)];
    const now = Date.now();
    const freezeId = now + Math.floor(Math.random() * 1000);
    const key = String(digit);

    setGame((current) => {
      if (current.phase !== 'playing' || current.items[teamId] <= 0) {
        return current;
      }

      if (current.frozenKeys[targetTeam][key]) {
        return current;
      }

      return {
        ...current,
        items: {
          ...current.items,
          [teamId]: current.items[teamId] - 1
        },
        frozenKeys: {
          ...current.frozenKeys,
          [targetTeam]: {
            ...current.frozenKeys[targetTeam],
            [key]: {
              id: freezeId,
              digit,
              expiresAt: now + ICE_FREEZE_MS
            }
          }
        }
      };
    });

    setIceShot({ id: freezeId, from: teamId });
    window.setTimeout(() => {
      setIceShot((current) => (current?.id === freezeId ? null : current));
    }, 720);
  };

  const appendDigit = (teamId: TeamId, digit: number) => {
    setGame((current) => {
      if (current.phase !== 'playing') {
        return current;
      }

      if (current.frozenKeys[teamId][String(digit)]) {
        return current;
      }

      const team = current.teams[teamId];
      if (team.input.length >= 4) {
        return current;
      }

      return {
        ...current,
        teams: {
          ...current.teams,
          [teamId]: {
            ...team,
            input: `${team.input}${digit}`
          }
        }
      };
    });
  };

  const clearInput = (teamId: TeamId) => {
    setGame((current) => ({
      ...current,
      teams: {
        ...current.teams,
        [teamId]: {
          ...current.teams[teamId],
          input: ''
        }
      }
    }));
  };

  const resetReactionSoon = (teamId: TeamId) => {
    window.setTimeout(() => {
      setGame((current) => {
        if (current.phase !== 'playing') {
          return current;
        }
        const team = current.teams[teamId];
        return {
          ...current,
          teams: {
            ...current.teams,
            [teamId]: {
              ...team,
              reaction: 'ready'
            }
          }
        };
      });
    }, 820);
  };

  const submitAnswer = (teamId: TeamId) => {
    let shouldResetReaction = false;

    setGame((current) => {
      if (current.phase !== 'playing') {
        return current;
      }

      const team = current.teams[teamId];
      if (team.input.trim() === '') {
        return current;
      }

      const value = Number(team.input);
      const isCorrect = value === team.problem.answer;
      const level = Math.floor((team.correct + current.teams[teamId].wrong) / 4) + 1;
      const direction = teamId === 'blue' ? 1 : -1;
      const nextCombo = isCorrect ? team.combo + 1 : 0;
      const meterDelta = isCorrect ? direction * (nextCombo >= 4 ? 3 : nextCombo >= 2 ? 2 : 1) : -direction;
      const pullSide: TeamId = meterDelta > 0 ? 'blue' : 'red';
      const scoreGain = isCorrect ? 90 + nextCombo * 15 : 0;
      const nextMeter = clamp(current.meter + meterDelta, -MAX_METER, MAX_METER);
      const nextTeam: TeamState = {
        ...team,
        score: team.score + scoreGain,
        combo: nextCombo,
        bestCombo: Math.max(team.bestCombo, nextCombo),
        correct: team.correct + (isCorrect ? 1 : 0),
        wrong: team.wrong + (isCorrect ? 0 : 1),
        input: '',
        problem: isCorrect ? makeProblem(level + nextCombo) : team.problem,
        reaction: isCorrect ? (nextCombo >= 3 ? 'boost' : 'cheer') : 'wrong'
      };
      const nextGame: GameState = {
        ...current,
        round: current.round + (isCorrect ? 1 : 0),
        meter: nextMeter,
        phase: Math.abs(nextMeter) >= MAX_METER ? 'ended' : current.phase,
        teams: {
          ...current.teams,
          [teamId]: nextTeam
        },
        lastEvent: {
          id: Date.now(),
          team: teamId,
          kind: isCorrect ? 'correct' : 'wrong',
          message: isCorrect ? `${nextTeam.name} 정답!` : `오답: ${team.problem.prompt} = ${team.problem.answer}`,
          pullSide
        }
      };

      shouldResetReaction = nextGame.phase === 'playing';
      return nextGame;
    });

    if (shouldResetReaction) {
      resetReactionSoon(teamId);
    }
  };

  const renderDigitButton = (teamId: TeamId, digit: number) => {
    const frozen = game.frozenKeys[teamId][String(digit)];
    const disabled = game.phase !== 'playing' || Boolean(frozen);

    return (
      <button
        key={digit}
        type="button"
        className={frozen ? styles.frozenKeyButton : undefined}
        disabled={disabled}
        onClick={() => appendDigit(teamId, digit)}
      >
        {digit}
        {frozen ? (
          <span key={frozen.id} className={styles.iceLock} aria-hidden="true">
            <span className={styles.iceEnergy} />
            <img src={ICE_ASSET} alt="" draggable={false} />
          </span>
        ) : null}
      </button>
    );
  };

  const renderIceItem = (teamId: TeamId) => {
    const itemCount = game.items[teamId];
    const disabled = game.phase !== 'playing' || itemCount <= 0;

    return (
      <button
        type="button"
        className={`${styles.iceItemButton} ${styles[`${teamId}IceItem`]}`}
        disabled={disabled}
        onClick={() => useIceItem(teamId)}
        aria-label={`${game.teams[teamId].name} 얼음 아이템 ${itemCount}개`}
      >
        <span className={styles.iceItemCount}>{itemCount}</span>
        <img src={ICE_ASSET} alt="" draggable={false} />
      </button>
    );
  };

  const renderTeamPanel = (teamId: TeamId) => {
    const team = game.teams[teamId];
    const config = teamConfig[teamId];
    const style = { '--team': config.css } as CSSProperties;
    const reaction = reactionFor(team, game);

    return (
      <section className={`${styles.playerPanel} ${styles[`${teamId}Panel`]}`} style={style}>
        <div className={styles.playerHeader}>
          <span>{config.side}</span>
          <strong>{team.name}</strong>
          <span>{team.score}</span>
        </div>

        <div className={styles.problemCard}>
          <img src={config.card} alt="" draggable={false} />
          <div className={styles.problemText}>
            <span>{team.problem.prompt}</span>
            <b>= ?</b>
          </div>
        </div>

        <div className={styles.characterZone}>
          <div
            className={styles.characterSprite}
            role="img"
            aria-label={`${team.name} 캐릭터`}
            style={{ '--character-sheet': `url("${characterSprites[teamId][reaction]}")` } as CSSProperties}
          />
        </div>

        <div className={styles.answerDisplay}>{team.input || ' '}</div>

        <div className={styles.keypad} aria-label={`${team.name} 숫자 입력`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => renderDigitButton(teamId, digit))}
          <button type="button" className={styles.clearButton} disabled={game.phase !== 'playing'} onClick={() => clearInput(teamId)}>
            C
          </button>
          {renderDigitButton(teamId, 0)}
          <button type="button" className={styles.goButton} disabled={game.phase !== 'playing'} onClick={() => submitAnswer(teamId)}>
            Go
          </button>
        </div>

        <div className={styles.teamStats}>
          <span>
            <b>{team.correct}</b> 정답
          </span>
          <span>
            <b>{team.combo}</b> 콤보
          </span>
          <span>
            <b>{team.bestCombo}</b> 최고
          </span>
        </div>
      </section>
    );
  };

  if (!introDone) {
    return (
      <main className={`${styles.shell} ${styles.introShell}`}>
        <section className={styles.introScene} aria-label="연산 배틀 시작 연출">
          <div className={styles.introLessonTitle}>두자리 수 덧셈</div>
          <img className={`${styles.introCharacter} ${styles.introBlue}`} src={`${ASSET_ROOT}/intro/blue-character-crop.png`} alt="블루팀 남학생" draggable={false} />
          <img className={`${styles.introCharacter} ${styles.introRed}`} src={`${ASSET_ROOT}/intro/red-character-crop.png`} alt="레드팀 여학생" draggable={false} />
          <div className={styles.introClash} aria-hidden="true" />
          <div className={styles.introFlash} aria-hidden="true" />
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.gameBoard}>
        {renderTeamPanel('blue')}

        <section className={styles.centerStage} aria-live="polite">
          <div className={styles.centerHud}>
            <div className={`${styles.centerScore} ${styles.blueCenterScore}`}>
              <span>{game.teams.blue.name}</span>
              <strong>{game.teams.blue.score}</strong>
            </div>

            <div className={styles.centerControls}>
              <button className={styles.centerTimeButton} type="button" onClick={adjustRoundDuration}>
                <span>ROUND {game.round}</span>
                <strong>{game.timeLeft}</strong>
              </button>
              <button className={styles.centerPlayButton} type="button" onClick={toggleGame}>
                {game.phase === 'playing' ? <Pause size={21} aria-hidden="true" /> : <Play size={21} aria-hidden="true" />}
                {game.phase === 'playing' ? '중지' : '시작'}
              </button>
            </div>

            <div className={`${styles.centerScore} ${styles.redCenterScore}`}>
              <span>{game.teams.red.name}</span>
              <strong>{game.teams.red.score}</strong>
            </div>
          </div>

          {pullSide ? (
            <div
              key={game.lastEvent.id}
              className={`${styles.pullFlash} ${styles[`${pullSide}PullFlash`]}`}
              aria-hidden="true"
            />
          ) : null}
          <div className={styles.itemLayer} aria-label="얼음 아이템">
            {renderIceItem('blue')}
            {renderIceItem('red')}
          </div>
          <div className={styles.centerObjectWrap}>
            <div className={styles.centerGuide} aria-hidden="true" />
            <div className={styles.tugViewport}>
              <div
                className={styles.tugSprite}
                aria-label="양 팀 줄다리기 장면"
                role="img"
                style={{ '--pull-x': `${tugOffset}px` } as CSSProperties}
              />
            </div>
          </div>
        </section>

        {renderTeamPanel('red')}
        {iceShot ? <img key={iceShot.id} className={`${styles.iceShot} ${styles[`${iceShot.from}IceShot`]}`} src={ICE_ASSET} alt="" draggable={false} /> : null}
      </div>
    </main>
  );
}
