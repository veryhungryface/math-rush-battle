'use client';

export type CurriculumAreaId = 'number' | 'geometry' | 'measure' | 'pattern' | 'data';

export type Problem = {
  prompt: string;
  answer: number;
  choices: number[];
  unit: string;
};

type ProblemDraft = Omit<Problem, 'unit'>;
type UnitFactory = {
  key: string;
  grade: number;
  area: CurriculumAreaId;
  label: string;
  make: (index: number) => ProblemDraft;
};

export type CurriculumUnit = {
  key: string;
  grade: number;
  area: CurriculumAreaId;
  label: string;
  problems: Problem[];
};

export const curriculumAreas: Array<{ id: CurriculumAreaId; label: string }> = [
  { id: 'number', label: '수와 연산' },
  { id: 'geometry', label: '도형' },
  { id: 'measure', label: '측정' },
  { id: 'pattern', label: '규칙/관계' },
  { id: 'data', label: '자료/가능성' }
];

const grades = [1, 2, 3, 4, 5, 6];

function rotate<T>(items: T[], amount: number) {
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function clean(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function choices(answer: number, candidates: number[], seed: number) {
  const values: number[] = [];
  [answer, ...candidates].forEach((value) => {
    const next = clean(value);
    if (!values.includes(next)) {
      values.push(next);
    }
  });
  let step = 1;
  while (values.length < 3) {
    const offset = step % 2 === 0 ? step / 2 : -((step + 1) / 2);
    const biasedOffset = seed % 2 === 0 ? offset : -offset;
    const rawNext = answer + biasedOffset;
    const next = clean(rawNext > 0 ? rawNext : answer + Math.abs(biasedOffset) + 1);
    if (next > 0 && !values.includes(next)) {
      values.push(next);
    }
    step += 1;
  }
  return rotate(values.slice(0, 3), seed);
}

function p(prompt: string, answer: number, candidates: number[], seed: number): ProblemDraft {
  return {
    prompt,
    answer: clean(answer),
    choices: choices(answer, candidates, seed)
  };
}

const unitFactories: UnitFactory[] = [
  {
    key: 'g1-number-9',
    grade: 1,
    area: 'number',
    label: '9까지의 수',
    make: (i) => {
      const answer = 2 + (i % 8);
      const base = Math.max(1, answer - 2);
      return p(`${base}보다 2 큰 수는?`, answer, [answer - 1, answer + 1], i);
    }
  },
  {
    key: 'g1-add-sub',
    grade: 1,
    area: 'number',
    label: '덧셈과 뺄셈',
    make: (i) => {
      const a = 3 + (i % 7);
      const b = 1 + ((i * 2) % 5);
      const answer = i % 2 === 0 ? a + b : a + b - b;
      const prompt = i % 2 === 0 ? `${a} + ${b} = ?` : `${a + b} - ${b} = ?`;
      return p(prompt, answer, [answer + 1, Math.max(1, answer - 1)], i);
    }
  },
  {
    key: 'g1-compare',
    grade: 1,
    area: 'measure',
    label: '비교하기',
    make: (i) => {
      const a = 4 + (i % 12);
      const diff = 1 + (i % 4);
      const answer = a + diff;
      return p(`${a}보다 ${diff} 큰 수는?`, answer, [a, answer - 1], i);
    }
  },
  {
    key: 'g1-clock',
    grade: 1,
    area: 'measure',
    label: '시계 보기',
    make: (i) => {
      const hour = 1 + (i % 12);
      const add = 1 + ((i * 2) % 4);
      const answer = ((hour + add - 1) % 12) + 1;
      return p(`${hour}시에서 ${add}시간 뒤는 몇 시?`, answer, [((answer + 1) % 12) + 1, hour], i);
    }
  },
  {
    key: 'g1-pattern',
    grade: 1,
    area: 'pattern',
    label: '규칙 찾기',
    make: (i) => {
      const start = 1 + (i % 5);
      const step = 1 + ((i + 1) % 3);
      const answer = start + step * 3;
      return p(`${start}, ${start + step}, ${start + step * 2}, ?`, answer, [answer + step, answer - step], i);
    }
  },
  {
    key: 'g2-place-value',
    grade: 2,
    area: 'number',
    label: '세 자리 수',
    make: (i) => {
      const h = 1 + (i % 8);
      const t = (i * 3) % 10;
      const o = (i * 7) % 10;
      const answer = h * 100 + t * 10 + o;
      return p(`100이 ${h}개, 10이 ${t}개, 1이 ${o}개인 수는?`, answer, [answer + 10, answer - o + t], i);
    }
  },
  {
    key: 'g2-add-sub',
    grade: 2,
    area: 'number',
    label: '두 자리 수 덧셈과 뺄셈',
    make: (i) => {
      const a = 21 + (i % 39);
      const b = 8 + ((i * 5) % 21);
      const answer = i % 3 === 0 ? a - b : a + b;
      const prompt = i % 3 === 0 ? `${a} - ${b} = ?` : `${a} + ${b} = ?`;
      return p(prompt, answer, [answer + 10, Math.max(1, answer - 10)], i);
    }
  },
  {
    key: 'g2-times-table',
    grade: 2,
    area: 'number',
    label: '곱셈구구',
    make: (i) => {
      const a = 2 + (i % 8);
      const b = 2 + ((i * 3) % 8);
      const answer = a * b;
      return p(`${a} × ${b} = ?`, answer, [answer + a, Math.max(2, answer - b)], i);
    }
  },
  {
    key: 'g2-length',
    grade: 2,
    area: 'measure',
    label: '길이',
    make: (i) => {
      const a = 12 + (i % 38);
      const b = 5 + ((i * 4) % 30);
      const answer = a + b;
      return p(`${a}cm + ${b}cm = ?cm`, answer, [answer + 5, answer - 4], i);
    }
  },
  {
    key: 'g2-time',
    grade: 2,
    area: 'measure',
    label: '시각과 시간',
    make: (i) => {
      const a = 10 + (i % 5) * 10;
      const b = 5 + ((i * 2) % 6) * 5;
      const answer = a + b;
      return p(`${a}분 + ${b}분 = ?분`, answer, [answer + 5, answer - 5], i);
    }
  },
  {
    key: 'g3-multiply',
    grade: 3,
    area: 'number',
    label: '곱셈',
    make: (i) => {
      const a = 11 + (i % 15);
      const b = 2 + ((i * 2) % 4);
      const answer = a * b;
      return p(`${a} × ${b} = ?`, answer, [answer + a, answer - b], i);
    }
  },
  {
    key: 'g3-division',
    grade: 3,
    area: 'number',
    label: '나눗셈',
    make: (i) => {
      const divisor = 2 + (i % 8);
      const answer = 4 + ((i * 3) % 9);
      return p(`${divisor * answer} ÷ ${divisor} = ?`, answer, [answer + 1, Math.max(1, answer - 1)], i);
    }
  },
  {
    key: 'g3-fraction-decimal',
    grade: 3,
    area: 'number',
    label: '분수와 소수',
    make: (i) => {
      const tenths = 1 + (i % 9);
      if (i % 2 === 0) {
        return p(`0.${tenths}은 0.1이 몇 개?`, tenths, [tenths + 1, Math.max(1, tenths - 1)], i);
      }
      const denominator = 3 + (i % 7);
      return p(`1/${denominator}에서 분모는?`, denominator, [denominator + 1, denominator - 1], i);
    }
  },
  {
    key: 'g3-shapes',
    grade: 3,
    area: 'geometry',
    label: '평면도형과 둘레',
    make: (i) => {
      const w = 3 + (i % 9);
      const h = 2 + ((i * 2) % 7);
      const answer = (w + h) * 2;
      return p(`가로 ${w}, 세로 ${h} 직사각형의 둘레는?`, answer, [w * h, answer + 2], i);
    }
  },
  {
    key: 'g3-time-length',
    grade: 3,
    area: 'measure',
    label: '시간과 길이',
    make: (i) => {
      const minutes = 1 + (i % 4);
      const seconds = (i % 2) * 30;
      const answer = minutes * 60 + seconds;
      return p(`${minutes}분 ${seconds}초는 몇 초?`, answer, [answer + 30, answer - 30], i);
    }
  },
  {
    key: 'g4-big-number',
    grade: 4,
    area: 'number',
    label: '큰 수',
    make: (i) => {
      const thousands = 2 + (i % 7);
      const hundreds = (i * 3) % 10;
      const answer = thousands * 1000 + hundreds * 100;
      return p(`1000이 ${thousands}개, 100이 ${hundreds}개인 수는?`, answer, [answer + 100, answer - 100], i);
    }
  },
  {
    key: 'g4-mul-div',
    grade: 4,
    area: 'number',
    label: '곱셈과 나눗셈',
    make: (i) => {
      const a = 18 + (i % 22);
      const b = 2 + ((i * 3) % 7);
      if (i % 2 === 0) {
        return p(`${a} × ${b} = ?`, a * b, [a * b + b, a * b - a], i);
      }
      const answer = a;
      return p(`${a * b} ÷ ${b} = ?`, answer, [answer + b, answer - 2], i);
    }
  },
  {
    key: 'g4-fraction',
    grade: 4,
    area: 'number',
    label: '분수의 덧셈',
    make: (i) => {
      const d = 5 + (i % 6);
      const a = 1 + (i % 3);
      const b = 1 + ((i + 1) % 3);
      const answer = a + b;
      return p(`${a}/${d} + ${b}/${d} = ?/${d}`, answer, [answer + 1, Math.max(1, answer - 1)], i);
    }
  },
  {
    key: 'g4-decimal',
    grade: 4,
    area: 'number',
    label: '소수의 덧셈',
    make: (i) => {
      const a = 2 + (i % 7);
      const b = 1 + ((i * 2) % 6);
      const answer = a + b;
      return p(`0.${a} + 0.${b}는 0.1이 몇 개?`, answer, [answer + 1, answer - 1], i);
    }
  },
  {
    key: 'g4-angle',
    grade: 4,
    area: 'geometry',
    label: '각도와 삼각형',
    make: (i) => {
      const first = 40 + (i % 5) * 10;
      const second = 30 + ((i * 2) % 4) * 10;
      const answer = 180 - first - second;
      return p(`삼각형 두 각이 ${first}도, ${second}도일 때 나머지는?`, answer, [answer + 10, answer - 10], i);
    }
  },
  {
    key: 'g5-factor-multiple',
    grade: 5,
    area: 'number',
    label: '약수와 배수',
    make: (i) => {
      const base = 3 + (i % 7);
      const nth = 2 + ((i * 2) % 5);
      const answer = base * nth;
      return p(`${base}의 ${nth}번째 배수는?`, answer, [answer + base, answer - base], i);
    }
  },
  {
    key: 'g5-fraction',
    grade: 5,
    area: 'number',
    label: '분수의 덧셈과 뺄셈',
    make: (i) => {
      const numerator = 1 + (i % 3);
      const other = 1 + ((i + 1) % 2);
      if (i % 2 === 0) {
        const answer = numerator * 2 + other;
        return p(`${numerator}/2 + ${other}/4 = ?/4`, answer, [answer + 1, answer - 1], i);
      }
      const answer = numerator * 2 - other;
      return p(`${numerator}/2 - ${other}/4 = ?/4`, answer, [answer + 1, Math.max(1, answer - 1)], i);
    }
  },
  {
    key: 'g5-decimal-multiply',
    grade: 5,
    area: 'number',
    label: '소수의 곱셈',
    make: (i) => {
      const tenths = 2 + (i % 7);
      const times = 2 + ((i * 2) % 5);
      const answer = tenths * times;
      return p(`0.${tenths} × ${times}는 0.1이 몇 개?`, answer, [answer + times, answer - tenths], i);
    }
  },
  {
    key: 'g5-area',
    grade: 5,
    area: 'geometry',
    label: '다각형의 넓이',
    make: (i) => {
      const base = 4 + (i % 8);
      const height = 2 + ((i * 3) % 6);
      const answer = i % 2 === 0 ? base * height : (base * height) / 2;
      const prompt = i % 2 === 0 ? `가로 ${base}, 세로 ${height} 직사각형 넓이는?` : `밑변 ${base}, 높이 ${height} 삼각형 넓이는?`;
      return p(prompt, answer, [answer + base, Math.max(1, answer - height)], i);
    }
  },
  {
    key: 'g5-average',
    grade: 5,
    area: 'data',
    label: '평균과 가능성',
    make: (i) => {
      const a = 4 + (i % 7);
      const b = a + 2;
      const c = a + 4;
      const answer = a + 2;
      return p(`${a}, ${b}, ${c}의 평균은?`, answer, [answer + 1, answer - 1], i);
    }
  },
  {
    key: 'g6-fraction-divide',
    grade: 6,
    area: 'number',
    label: '분수의 나눗셈',
    make: (i) => {
      const whole = 2 + (i % 5);
      const denom = 2 + ((i * 2) % 4);
      const answer = whole * denom;
      return p(`${whole} ÷ 1/${denom} = ?`, answer, [answer + denom, answer - whole], i);
    }
  },
  {
    key: 'g6-decimal-divide',
    grade: 6,
    area: 'number',
    label: '소수의 나눗셈',
    make: (i) => {
      const answer = 2 + (i % 8);
      const divisor = 2 + ((i * 3) % 4);
      return p(`${clean(answer * divisor / 10)} ÷ 0.${divisor} = ?`, answer, [answer + 1, answer - 1], i);
    }
  },
  {
    key: 'g6-ratio',
    grade: 6,
    area: 'pattern',
    label: '비와 비율',
    make: (i) => {
      const percent = [10, 20, 25, 50, 75][i % 5];
      const whole = [20, 40, 60, 80, 100][(i * 2) % 5];
      const answer = clean((percent / 100) * whole);
      return p(`${whole}의 ${percent}%는?`, answer, [answer + 5, Math.max(1, answer - 5)], i);
    }
  },
  {
    key: 'g6-circle',
    grade: 6,
    area: 'geometry',
    label: '원의 둘레와 넓이',
    make: (i) => {
      const r = 2 + (i % 5);
      if (i % 2 === 0) {
        return p(`반지름 ${r}, 원주율 3일 때 원의 넓이는?`, 3 * r * r, [6 * r, 3 * r * r + 3], i);
      }
      return p(`반지름 ${r}, 원주율 3일 때 원의 둘레는?`, 6 * r, [3 * r * r, 6 * r + 6], i);
    }
  },
  {
    key: 'g6-graph',
    grade: 6,
    area: 'data',
    label: '자료와 그래프',
    make: (i) => {
      const a = 6 + (i % 6);
      const b = a + 4;
      const c = a + 8;
      const answer = a + 4;
      return p(`${a}, ${b}, ${c}의 평균은?`, answer, [answer + 2, answer - 2], i);
    }
  }
];

export const curriculumGrades = grades;

export const curriculumUnits: CurriculumUnit[] = unitFactories.map((unit) => ({
  key: unit.key,
  grade: unit.grade,
  area: unit.area,
  label: unit.label,
  problems: Array.from({ length: 30 }, (_, index) => ({
    ...unit.make(index),
    unit: `${unit.grade}학년 ${unit.label}`
  }))
}));

export const allCurriculumProblems = curriculumUnits.flatMap((unit) => unit.problems);

export function getProblemPool(selectedUnitKeys: string[]) {
  const selected = new Set(selectedUnitKeys);
  const pool = curriculumUnits
    .filter((unit) => selected.has(unit.key))
    .flatMap((unit) => unit.problems);
  return pool.length > 0 ? pool : allCurriculumProblems;
}
