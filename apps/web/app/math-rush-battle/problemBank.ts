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
const baseProblemCount = 30;
const enrichedProblemCount = 60;

function rotate<T>(items: T[], amount: number) {
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function clean(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
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
    key: 'g2-data',
    grade: 2,
    area: 'data',
    label: '표와 그래프',
    make: (i) => {
      const a = 4 + (i % 7);
      const b = 2 + ((i * 3) % 8);
      const c = 1 + ((i * 5) % 6);
      const variant = i % 3;
      if (variant === 0) {
        return p(`사과 ${a}개, 배 ${b}개. 모두 몇 개?`, a + b, [a + c, b + c], i);
      }
      if (variant === 1) {
        return p(`${a}개와 ${b}개 중 더 많은 쪽은 몇 개?`, Math.max(a, b), [Math.min(a, b), Math.max(a, b) + 1], i);
      }
      return p(`${a}개, ${b}개, ${c}개의 합은?`, a + b + c, [a + b, b + c], i);
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
    key: 'g3-liquid-weight',
    grade: 3,
    area: 'measure',
    label: '들이와 무게',
    make: (i) => {
      const a = 2 + (i % 7);
      const b = 1 + ((i * 2) % 6);
      if (i % 2 === 0) {
        return p(`${a}L + ${b}L = ?L`, a + b, [a + b + 1, Math.max(1, a + b - 1)], i);
      }
      const kg = 1 + (i % 5);
      const g = 100 * (1 + ((i * 3) % 8));
      return p(`${kg}kg ${g}g은 몇 g?`, kg * 1000 + g, [kg * 1000, kg * 1000 + g + 100], i);
    }
  },
  {
    key: 'g3-data',
    grade: 3,
    area: 'data',
    label: '자료의 정리',
    make: (i) => {
      const a = 5 + (i % 8);
      const b = 2 + ((i * 3) % 7);
      const c = 3 + ((i * 5) % 6);
      const variant = i % 3;
      if (variant === 0) {
        const other = a + 1 + ((i * 3) % 5);
        return p(`A ${a}명, B ${other}명. 차이는?`, other - a, [a + other, other], i);
      }
      if (variant === 1) {
        return p(`${a}, ${b}, ${c} 중 가장 큰 수는?`, Math.max(a, b, c), [Math.min(a, b, c), a + b], i);
      }
      return p(`${a}명과 ${b}명을 합하면?`, a + b, [a + c, b + c], i);
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
    key: 'g4-graph',
    grade: 4,
    area: 'data',
    label: '막대와 꺾은선그래프',
    make: (i) => {
      const mon = 6 + (i % 8);
      const tue = mon + 1 + (i % 4);
      const wed = tue - (i % 3);
      const variant = i % 3;
      if (variant === 0) {
        return p(`월 ${mon}, 화 ${tue}. 늘어난 수는?`, tue - mon, [tue + mon, tue - mon + 1], i);
      }
      if (variant === 1) {
        return p(`월 ${mon}, 화 ${tue}, 수 ${wed}. 가장 큰 수는?`, Math.max(mon, tue, wed), [mon + tue, Math.min(mon, tue, wed)], i);
      }
      return p(`월 ${mon}, 화 ${tue}. 합은?`, mon + tue, [tue - mon, mon + wed], i);
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
    key: 'g5-mixed-calc',
    grade: 5,
    area: 'number',
    label: '자연수의 혼합 계산',
    make: (i) => {
      const a = 3 + (i % 7);
      const b = 2 + ((i * 2) % 6);
      const c = 1 + ((i * 5) % 5);
      if (i % 2 === 0) {
        return p(`${a} + ${b} × ${c} = ?`, a + b * c, [a * b + c, a + b + c], i);
      }
      return p(`(${a} + ${b}) × ${c} = ?`, (a + b) * c, [a + b * c, a * b + c], i);
    }
  },
  {
    key: 'g5-rule-correspond',
    grade: 5,
    area: 'pattern',
    label: '규칙과 대응',
    make: (i) => {
      const input = 2 + (i % 9);
      const multiplier = 2 + ((i * 2) % 4);
      const add = i % 4;
      const answer = input * multiplier + add;
      return p(`□=${input}, □×${multiplier}+${add}=?`, answer, [input + multiplier + add, answer + multiplier], i);
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
  },
  {
    key: 'g6-volume',
    grade: 6,
    area: 'geometry',
    label: '직육면체의 부피',
    make: (i) => {
      const w = 2 + (i % 5);
      const h = 2 + ((i * 2) % 4);
      const d = 3 + ((i * 3) % 5);
      if (i % 2 === 0) {
        return p(`${w}×${h}×${d} 직육면체 부피는?`, w * h * d, [w * h + d, w * h * d + w], i);
      }
      return p(`가로 ${w}, 세로 ${h}, 높이 ${d}. 밑넓이는?`, w * h, [w * h * d, w + h], i);
    }
  },
  {
    key: 'g6-proportion',
    grade: 6,
    area: 'pattern',
    label: '비례식과 비례배분',
    make: (i) => {
      const a = 2 + (i % 5);
      const b = 3 + ((i * 2) % 5);
      const scale = 2 + ((i * 3) % 4);
      if (i % 2 === 0) {
        return p(`${a}:${b} = ${a * scale}:?`, b * scale, [a * scale, b * scale + b], i);
      }
      const total = (a + b) * scale;
      return p(`${total}을 ${a}:${b}로 나눌 때 앞쪽은?`, a * scale, [b * scale, total - a], i);
    }
  }
];

const enrichedProblemMakers: Record<string, (index: number) => ProblemDraft> = {
  'g1-number-9': (i) => {
    const a = 1 + (i % 7);
    const b = Math.min(9, a + 2);
    return i % 2 === 0
      ? p(`${b} 바로 앞의 수는?`, b - 1, [b, Math.max(1, b - 2)], i)
      : p(`${a}와 ${b} 사이의 수는?`, a + 1, [a, b], i);
  },
  'g1-add-sub': (i) => {
    const a = 2 + (i % 5);
    const b = 1 + ((i * 2) % 4);
    const c = 1 + ((i * 3) % 3);
    return i % 2 === 0
      ? p(`${a} + ${b} + ${c} = ?`, a + b + c, [a + b, b + c], i)
      : p(`${a + b + c} - ${b} = ?`, a + c, [a + b, b + c], i);
  },
  'g1-compare': (i) => {
    const a = 5 + (i % 10);
    const b = 1 + ((i * 2) % 5);
    return i % 2 === 0
      ? p(`${a}보다 ${b} 작은 수는?`, a - b, [a + b, a - b + 1], i)
      : p(`${a}와 ${a + b}의 차이는?`, b, [a, a + b], i);
  },
  'g1-clock': (i) => {
    const hour = 1 + (i % 12);
    const before = 1 + ((i * 2) % 3);
    const answer = ((hour - before - 1 + 12) % 12) + 1;
    return p(`${hour}시에서 ${before}시간 전은 몇 시?`, answer, [hour, ((answer + 1) % 12) + 1], i);
  },
  'g1-pattern': (i) => {
    const patterns = [
      [2, 4, 6, 8],
      [1, 3, 5, 7],
      [3, 6, 9, 12],
      [5, 7, 9, 11]
    ];
    const pattern = pick(patterns, i);
    return p(`${pattern[0]}, ${pattern[1]}, ${pattern[2]}, ?`, pattern[3], [pattern[3] - 1, pattern[3] + 1], i);
  },
  'g2-place-value': (i) => {
    const h = 2 + (i % 7);
    const t = 1 + ((i * 2) % 8);
    return p(`${h * 100 + t * 10}에서 10은 몇 개?`, h * 10 + t, [t, h + t], i);
  },
  'g2-add-sub': (i) => {
    const a = 25 + (i % 35);
    const b = 6 + ((i * 3) % 18);
    return i % 2 === 0
      ? p(`${a} + ${b} = ?`, a + b, [a + b + 9, a + b - 9], i)
      : p(`${a} - ${b} = ?`, a - b, [a - b + 10, Math.max(1, a - b - 10)], i);
  },
  'g2-times-table': (i) => {
    const a = 2 + (i % 8);
    const b = 1 + ((i * 5) % 9);
    return p(`${a}씩 ${b}묶음은?`, a * b, [a + b, a * (b + 1)], i);
  },
  'g2-length': (i) => {
    const m = 1 + (i % 4);
    const cm = 10 * (1 + ((i * 2) % 8));
    return p(`${m}m ${cm}cm는 몇 cm?`, m * 100 + cm, [m * 100, m * 100 + cm + 10], i);
  },
  'g2-time': (i) => {
    const minutes = 15 + (i % 4) * 10;
    const add = pick([5, 10, 15, 20], i);
    return p(`${minutes}분에서 ${add}분 뒤는?`, minutes + add, [minutes, minutes + add + 5], i);
  },
  'g2-data': (i) => {
    const a = 3 + (i % 8);
    const b = 2 + ((i * 3) % 7);
    return p(`표에서 남학생 ${a}명, 여학생 ${b}명. 모두?`, a + b, [Math.abs(a - b), a + b + 1], i);
  },
  'g3-multiply': (i) => {
    const a = 12 + (i % 18);
    const b = pick([2, 3, 4, 5], i);
    return p(`${a}의 ${b}배는?`, a * b, [a + b, a * b + b], i);
  },
  'g3-division': (i) => {
    const divisor = 2 + (i % 7);
    const answer = 3 + ((i * 2) % 10);
    return p(`${divisor * answer}개를 ${divisor}명에게 똑같이 나누면?`, answer, [answer + divisor, Math.max(1, answer - 1)], i);
  },
  'g3-fraction-decimal': (i) => {
    const tenths = 2 + (i % 8);
    return i % 2 === 0
      ? p(`${tenths}/10은 소수 첫째 자리 숫자가?`, tenths, [tenths + 1, tenths - 1], i)
      : p(`0.${tenths} + 0.1은 0.1이 몇 개?`, tenths + 1, [tenths, tenths + 2], i);
  },
  'g3-shapes': (i) => {
    const side = 3 + (i % 8);
    const w = 4 + (i % 6);
    const h = 2 + ((i * 2) % 5);
    return i % 2 === 0
      ? p(`한 변 ${side} 정사각형 둘레는?`, side * 4, [side * 2, side * side], i)
      : p(`직사각형 가로 ${w}, 세로 ${h}. 둘레는?`, (w + h) * 2, [w * h, w + h], i);
  },
  'g3-time-length': (i) => {
    const hour = 1 + (i % 3);
    const minute = 10 * (1 + ((i * 2) % 5));
    return p(`${hour}시간 ${minute}분은 몇 분?`, hour * 60 + minute, [hour * 60, hour * 60 + minute + 10], i);
  },
  'g3-liquid-weight': (i) => {
    const a = 300 + (i % 6) * 100;
    const b = 100 + ((i * 2) % 5) * 100;
    return p(`${a}mL + ${b}mL = ?mL`, a + b, [Math.abs(a - b), a + b + 100], i);
  },
  'g3-data': (i) => {
    const a = 4 + (i % 6);
    const b = a + 2;
    const c = b + 1;
    return p(`자료 ${a}, ${b}, ${c} 중 가운데 수는?`, b, [a, c], i);
  },
  'g4-big-number': (i) => {
    const tenThousands = 1 + (i % 8);
    const thousands = 2 + ((i * 3) % 7);
    const answer = tenThousands * 10000 + thousands * 1000;
    return p(`10000이 ${tenThousands}개, 1000이 ${thousands}개인 수는?`, answer, [answer + 1000, answer - 1000], i);
  },
  'g4-mul-div': (i) => {
    const answer = 12 + (i % 18);
    const divisor = 3 + ((i * 2) % 6);
    return i % 2 === 0
      ? p(`${answer} × ${divisor} = ?`, answer * divisor, [answer * divisor + answer, answer + divisor], i)
      : p(`${answer * divisor} ÷ ${answer} = ?`, divisor, [answer, divisor + 2], i);
  },
  'g4-fraction': (i) => {
    const d = 6 + (i % 5);
    const a = 2 + (i % 3);
    const b = 1 + ((i * 2) % 3);
    return i % 2 === 0
      ? p(`${a}/${d} + ${b}/${d} = ?/${d}`, a + b, [a + b + 1, Math.max(1, a + b - 1)], i)
      : p(`${a + b}/${d} - ${b}/${d} = ?/${d}`, a, [b, a + b], i);
  },
  'g4-decimal': (i) => {
    const a = 10 + (i % 8);
    const b = 1 + ((i * 3) % 7);
    return p(`${clean(a / 10)} + 0.${b} = ?`, clean(a / 10 + b / 10), [clean(a / 10), clean(a / 10 + b / 10 + 0.1)], i);
  },
  'g4-angle': (i) => {
    const base = pick([30, 45, 60, 90, 120], i);
    const add = pick([10, 15, 20, 30], i + 1);
    return p(`${base}도 + ${add}도 = ?도`, base + add, [base, base + add + 10], i);
  },
  'g4-graph': (i) => {
    const a = 8 + (i % 8);
    const b = a + pick([2, 3, 4, 5], i);
    return p(`그래프에서 ${a}에서 ${b}로 늘었다. 증가량은?`, b - a, [a + b, b - a + 1], i);
  },
  'g5-factor-multiple': (i) => {
    const n = 12 + (i % 18);
    const factors = Array.from({ length: n }, (_, index) => index + 1).filter((value) => n % value === 0);
    const answer = factors.length;
    return p(`${n}의 약수는 몇 개?`, answer, [Math.max(1, answer - 1), answer + 1], i);
  },
  'g5-fraction': (i) => {
    const numerator = 3 + (i % 4);
    return p(`${numerator}/3 - 1/3 = ?/3`, numerator - 1, [numerator, Math.max(1, numerator - 2)], i);
  },
  'g5-decimal-multiply': (i) => {
    const tenths = 2 + (i % 7);
    const times = pick([3, 4, 5, 6], i);
    return p(`${clean(tenths / 10)} × ${times} = ?`, clean((tenths * times) / 10), [clean((tenths * (times + 1)) / 10), tenths * times], i);
  },
  'g5-area': (i) => {
    const base = 6 + (i % 8);
    const height = pick([2, 4, 6, 8], i);
    return p(`밑변 ${base}, 높이 ${height} 평행사변형 넓이는?`, base * height, [base + height, (base * height) / 2], i);
  },
  'g5-average': (i) => {
    const mid = 6 + (i % 8);
    return p(`${mid - 2}, ${mid}, ${mid + 2}, ${mid + 4}의 평균은?`, mid + 1, [mid, mid + 2], i);
  },
  'g5-mixed-calc': (i) => {
    const a = 4 + (i % 6);
    const b = 2 + ((i * 2) % 5);
    const c = 2 + ((i * 3) % 4);
    return p(`${a} × (${b} + ${c}) = ?`, a * (b + c), [a * b + c, a + b + c], i);
  },
  'g5-rule-correspond': (i) => {
    const input = 3 + (i % 8);
    const answer = input * input;
    return p(`한 변 ${input}인 정사각형 넓이 규칙값은?`, answer, [input * 4, answer + input], i);
  },
  'g6-fraction-divide': (i) => {
    const denom = pick([2, 3, 4, 5, 6], i);
    const whole = 2 + (i % 4);
    return p(`${whole} ÷ 1/${denom} = ?`, whole * denom, [whole + denom, whole * denom + denom], i);
  },
  'g6-decimal-divide': (i) => {
    const answer = 3 + (i % 7);
    const divisor = pick([2, 4, 5], i);
    return p(`${clean((answer * divisor) / 10)} ÷ ${clean(divisor / 10)} = ?`, answer, [answer + 1, Math.max(1, answer - 1)], i);
  },
  'g6-ratio': (i) => {
    const whole = pick([40, 60, 80, 100, 120], i);
    const ratio = pick([25, 50, 75], i + 1);
    const answer = clean((whole * ratio) / 100);
    return p(`${whole}의 ${ratio}%는?`, answer, [answer + 5, Math.max(1, answer - 5)], i);
  },
  'g6-circle': (i) => {
    const diameter = 4 + (i % 6) * 2;
    return p(`지름 ${diameter}, 원주율 3일 때 원의 둘레는?`, diameter * 3, [diameter + 3, diameter * 3 + 3], i);
  },
  'g6-graph': (i) => {
    const a = 10 + (i % 7);
    const b = a + 5;
    const c = a + 10;
    return p(`${a}, ${b}, ${c}의 평균은?`, b, [a, c], i);
  },
  'g6-volume': (i) => {
    const side = 2 + (i % 5);
    return p(`한 모서리 ${side} 정육면체 부피는?`, side * side * side, [side * 6, side * side], i);
  },
  'g6-proportion': (i) => {
    const a = pick([2, 3, 4, 5], i);
    const scale = 2 + (i % 5);
    return p(`${a}:1 = ?:${scale}`, a * scale, [a + scale, a * scale + a], i);
  }
};

function makeUnitProblem(unit: UnitFactory, index: number): ProblemDraft {
  if (index < baseProblemCount) {
    return unit.make(index);
  }

  return enrichedProblemMakers[unit.key]?.(index - baseProblemCount) ?? unit.make(index);
}

export const curriculumGrades = grades;

export const curriculumUnits: CurriculumUnit[] = unitFactories.map((unit) => ({
  key: unit.key,
  grade: unit.grade,
  area: unit.area,
  label: unit.label,
  problems: Array.from({ length: enrichedProblemCount }, (_, index) => ({
    ...makeUnitProblem(unit, index),
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
