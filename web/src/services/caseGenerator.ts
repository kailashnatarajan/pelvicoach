/* caseGenerator.ts
 * In-browser generator of reproducible synthetic EMG cases across 7 clinical scenarios.
 * Pure math & signal synthesis with seed-based pseudo-random generator.
 */

import { NormalizedSession, parseSession, ParseResult } from './sessionSchema';
import * as SignalFeedback from './signalFeedback';

export interface ScenarioSpec {
  dur?: number;
  bg?: number;
  art?: string[];
  artScale?: number;
  dropout?: Array<[number, number]>;
  schedule?: (R: () => number, U: (a: number, b: number) => number, dur: number) => any[];
}

export interface ScenarioDefinition {
  id: string;
  key: string;
  name: string;
  question: string;
  pattern: string;
  signal: string[];
  extra: string[];
  quality: string;
  alt: string[];
  more: string[];
  profile: {
    complaints: string[];
    history: string[];
    cog: number;
  };
  exam: {
    oxford: [number, number];
    tone: string[];
    endurance: [number, number];
    reps: [number, number];
    fast: [number, number];
  };
  spec: (r: () => number) => ScenarioSpec;
  read: (m: any) => string;
  abdominal?: boolean;
}

const DUR = 15;
const REPS = 5;
const PERIOD = 2.8;
const CUE0 = 1.2;
const DET = 0.15;
const MORE_TONE = 'A clinician-performed examination of resting tone and ability to release.';
const MORE_POWER = 'A clinician-performed strength assessment (for example Modified Oxford), if indicated.';

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length)];
const rep = (f: (k: number, R: () => number, U: (a: number, b: number) => number) => any) =>
  (R: () => number, U: (a: number, b: number) => number) =>
    Array.from({ length: REPS }, (_, k) => {
      const p = f(k, R, U);
      const cue = CUE0 + k * PERIOD;
      const s = cue + p.delay;
      return Object.assign({ cue_s: cue, start_s: s, end_s: s + p.len, simulated_amplitude: p.amp }, p);
    });

const num = (v: number | null | undefined, u = '', d = 2): string =>
  v == null ? 'n/a' : v.toFixed(d) + u;

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'PF-SIM-001',
    key: 'typical',
    name: 'Typical contraction and release',
    question: 'What does a clear, well-timed squeeze and release look like on the activity envelope?',
    pattern: 'Quiet baseline, clear activation after each cue, a steady hold and a prompt return to rest.',
    signal: [
      'Low resting baseline',
      'Activation shortly after each cue',
      'Steady plateau with little decline',
      'Return to baseline before the next cue',
    ],
    extra: ['Oxford score 3 to 5 (optional)', 'Resting tone typical'],
    quality: 'Good',
    alt: ['A tidy trace does not establish strength: effort, placement and understanding of the instruction still matter.'],
    more: [MORE_POWER, 'Symptom history and comparison with earlier sessions.'],
    profile: {
      complaints: [
        'Occasional urinary leakage on coughing',
        'Mild urgency',
        'Wants to maintain pelvic-floor fitness after rehabilitation',
      ],
      history: ['Two vaginal deliveries', 'No pelvic surgery', 'Hysterectomy more than 10 years ago'],
      cog: 0.95,
    },
    exam: { oxford: [3, 5], tone: ['typical'], endurance: [6, 10], reps: [5, 8], fast: [6, 10] },
    spec: () => ({
      dur: DUR,
      bg: 0.04,
      art: ['baseline_drift'],
      artScale: 0.3,
      schedule: rep((_k, _R, U) => ({ delay: U(0.25, 0.45), len: U(1.1, 1.4), amp: U(0.35, 0.5), decay: 0.05 })),
    }),
    read: (m: any) =>
      'The simulated envelope rises about ' +
      num(m.peak, ' a.u.') +
      ' above baseline roughly ' +
      num(m.lat, ' s') +
      ' after each cue and returns to baseline in about ' +
      num(m.relax, ' s') +
      '. This is a reference pattern for the protocol, not a universal definition of normal.',
  },
  {
    id: 'PF-SIM-002',
    key: 'reduced',
    name: 'Reduced voluntary activation',
    question: 'Is the rise above baseline small or variable compared with the other cases?',
    pattern: 'Small increase above baseline, variable amplitude and shorter holds across repetitions.',
    signal: [
      'Small activation above baseline',
      'Variable amplitude between repetitions',
      'Shorter sustained activity',
    ],
    extra: ['Oxford score 1 to 3 (optional)', 'Resting tone low or typical'],
    quality: 'Good',
    alt: ['Electrode placement or skin contact', 'Understanding of the instruction', 'Effort or discomfort', 'Signal gain'],
    more: [MORE_POWER, 'A repeat recording with checked electrode placement.', 'Review of how the exercise was explained.'],
    profile: {
      complaints: ['Urinary leakage on coughing and lifting', 'Leakage on standing up', 'Heaviness after long walks'],
      history: ['Three vaginal deliveries', 'Post-menopausal, no hormone therapy', 'Previous prolapse repair'],
      cog: 0.85,
    },
    exam: { oxford: [1, 3], tone: ['low', 'typical'], endurance: [2, 5], reps: [2, 5], fast: [2, 6] },
    spec: () => ({
      dur: DUR,
      bg: 0.04,
      art: ['baseline_drift'],
      artScale: 0.3,
      schedule: rep((_k, _R, U) => ({ delay: U(0.3, 0.6), len: U(0.7, 1.2), amp: U(0.09, 0.16) * U(0.85, 1.15) })),
    }),
    read: (m: any) =>
      'The recorded activation is small (about ' +
      num(m.peak, ' a.u.') +
      ' above baseline) and varies by ' +
      num(m.cv, '%', 0) +
      ' between repetitions. This describes the recorded pattern only. EMG alone cannot conclude that the muscle is weak.',
  },
  {
    id: 'PF-SIM-003',
    key: 'relaxation',
    name: 'Incomplete relaxation',
    question: 'Does activity return toward baseline after the release cue, or stay elevated?',
    pattern: 'A normal-sized contraction followed by slow recovery; the next effort can begin before full recovery.',
    signal: [
      'Clear activation',
      'Elevated activity after the release cue',
      'Slow decay toward baseline',
      'Recovery often unfinished at the next cue',
    ],
    extra: ['Resting tone elevated (optional)', 'Oxford score 3 to 4 (optional)'],
    quality: 'Good',
    alt: ['Slow release as a learned habit', 'Discomfort or guarding', 'Unclear release cue', 'Electrode drift'],
    more: [MORE_TONE, 'Patient-reported pain or difficulty emptying.', 'A longer rest period in the protocol.'],
    profile: {
      complaints: ['Constipation and straining', 'Pelvic discomfort when sitting', 'Urgency with incomplete emptying'],
      history: ['One vaginal delivery', 'Previous pelvic surgery', 'Long-standing constipation'],
      cog: 0.9,
    },
    exam: { oxford: [3, 4], tone: ['elevated', 'elevated', 'typical'], endurance: [5, 9], reps: [4, 7], fast: [3, 7] },
    spec: () => ({
      dur: DUR,
      bg: 0.04,
      art: ['baseline_drift'],
      artScale: 0.3,
      schedule: rep((_k, _R, U) => ({
        delay: U(0.25, 0.45),
        len: 1.2,
        amp: U(0.3, 0.45),
        tail_s: U(0.9, 1.5),
        tail_frac: U(0.45, 0.65),
      })),
    }),
    read: (m: any) =>
      'The squeeze reaches about ' +
      num(m.peak, ' a.u.') +
      ' above baseline. Return to the resting range ' +
      (m.relaxed ? 'took about ' + num(m.relax, ' s') + ' where it happened, and ' : '') +
      'was not reached before the next cue in ' +
      m.relaxMissed +
      ' of ' +
      m.detected +
      ' repetitions. A peak and the ability to return to rest are separate features.',
  },
  {
    id: 'PF-SIM-004',
    key: 'compensatory',
    name: 'Compensatory muscle activity',
    question: 'Is the target contraction accompanied by activity in another muscle group?',
    pattern: 'The pelvic-floor channel activates, and a separate abdominal channel rises with or just before it.',
    signal: [
      'Distinct pelvic-floor activation',
      'Abdominal channel rises during the squeeze',
      'Abdominal onset slightly early',
    ],
    extra: ['Abdominal channel (simulated)', 'Gluteal or thigh channels (not simulated here)'],
    quality: 'Good',
    abdominal: true,
    alt: ['Breath-holding or bearing down', 'Effort to follow the cue', 'Cross-talk between nearby electrodes', 'Posture'],
    more: ['Observation of posture and breathing during the squeeze.', 'Additional channels if gluteal or thigh substitution is a question.', MORE_POWER],
    profile: {
      complaints: ['Leakage on lifting', 'Urgency', 'Difficulty finding the right muscles'],
      history: ['Two vaginal deliveries', 'Chronic cough', 'Previous back pain'],
      cog: 0.9,
    },
    exam: { oxford: [2, 4], tone: ['typical', 'elevated'], endurance: [3, 7], reps: [3, 6], fast: [3, 7] },
    spec: () => ({
      dur: DUR,
      bg: 0.04,
      art: ['baseline_drift'],
      artScale: 0.3,
      schedule: rep((_k, _R, U) => ({ delay: U(0.25, 0.5), len: U(1.1, 1.4), amp: U(0.25, 0.4), decay: 0.05 })),
    }),
    read: (m: any) =>
      'During the squeeze the abdominal channel rises about ' +
      num(m.abdRise, ' a.u.') +
      ' (' +
      num(m.abdRatio, 'x the pelvic-floor rise') +
      '), and starts earlier than the pelvic-floor channel in ' +
      m.abdLead +
      ' of ' +
      m.detected +
      ' repetitions. This indicates co-activation.',
  },
  {
    id: 'PF-SIM-005',
    key: 'unreliable',
    name: 'Unreliable signal',
    question: 'Is the recording good enough to interpret at all?',
    pattern: 'Dropout, drift, mains interference and motion artifacts overlie the muscle activity.',
    signal: [
      'A flat segment (dropout/lift-off)',
      'Baseline drift',
      '50 Hz interference',
      'Motion artifacts and possible cross-talk',
    ],
    extra: ['Any examination fields may be present but cannot be matched to the signal'],
    quality: 'Limited or uninterpretable',
    alt: ['Poor skin contact or lifted electrode', 'Cable movement', 'Nearby electrical equipment'],
    more: [
      'Re-fit and re-check the electrodes, then repeat the recording.',
      'Check the mains-interference setting.',
      'Repeat the protocol before comparing with earlier sessions.',
    ],
    profile: {
      complaints: ['Urinary leakage', 'Urgency', 'Heaviness'],
      history: ['Two vaginal deliveries', 'No pelvic surgery', 'Restless during recording'],
      cog: 0.8,
    },
    exam: { oxford: [2, 4], tone: ['typical'], endurance: [3, 7], reps: [3, 6], fast: [3, 7] },
    spec: (r: () => number) => {
      const s = 3 + r() * 6;
      return {
        dur: DUR,
        bg: 0.04,
        art: ['baseline_drift', '50_hz_powerline_interference', 'motion_artifact', 'simulated_crosstalk'],
        artScale: 3,
        dropout: [[+s.toFixed(2), +(s + 1.5 + r() * 1.5).toFixed(2)]],
        schedule: rep((_k, _R, U) => ({ delay: U(0.25, 0.5), len: U(1.1, 1.4), amp: U(0.25, 0.4) })),
      };
    },
    read: (m: any) =>
      'A large share of the recording (' +
      num(m.flagShare * 100, '%', 0) +
      ' of analysis windows) is flagged for signal quality, so the numbers beside it should not be read as muscle function. The correct output here is low confidence.',
  },
  {
    id: 'PF-SIM-006',
    key: 'endurance',
    name: 'Reduced endurance across repetitions',
    question: 'Does performance fall within each squeeze and across repeated efforts?',
    pattern: 'Each repetition starts lower than the last and fades during the hold.',
    signal: ['Declining peak across repetitions', 'Fading level within each hold', 'Recovery periods recorded'],
    extra: ['Clinician-entered endurance and repetition counts (optional)'],
    quality: 'Good',
    alt: ['Electrode movement', 'Changing effort or attention', 'Skin moisture changes', 'True muscle fatigue'],
    more: ['Clinician-recorded endurance and repetitions (PERFECT scheme).', 'A comparison with the previous session under the same protocol.', 'Patient-reported tiredness.'],
    profile: {
      complaints: ['Leakage that worsens later in the day', 'Urgency', 'Leakage after prolonged walking'],
      history: ['Two vaginal deliveries', 'Reduced general stamina', 'Osteoarthritis'],
      cog: 0.9,
    },
    exam: { oxford: [2, 4], tone: ['typical', 'low'], endurance: [2, 5], reps: [2, 4], fast: [2, 5] },
    spec: (r: () => number) => {
      const a0 = 0.4 + r() * 0.1;
      const d = 0.1 + r() * 0.06;
      return {
        dur: DUR,
        bg: 0.04,
        art: ['baseline_drift'],
        artScale: 0.3,
        schedule: rep((k) => ({
          delay: 0.3,
          len: 1.5,
          amp: a0 * (1 - k * d),
          decay: Math.min(0.6, 0.12 + 0.1 * k),
        })),
      };
    },
    read: (m: any) =>
      'Peak activation changes across repetitions (consistency ' +
      num(m.cv, '% variation', 0) +
      ') and fades within each hold (end-of-hold level about ' +
      num(m.endur, '%', 0) +
      ' of the start). A falling amplitude alone is not proof of fatigue.',
  },
  {
    id: 'PF-SIM-007',
    key: 'delayed',
    name: 'Delayed or inconsistent activation',
    question: 'Does activity follow each cue at a steady delay, or vary and sometimes fail to appear?',
    pattern: 'The delay between cue and activity changes from repetition to repetition; a repetition may be missed.',
    signal: ['Variable delay after the cue', 'Inconsistent onset', 'Possible missed or mistimed repetition'],
    extra: ['Patient-reported difficulty understanding the exercise (optional)'],
    quality: 'Good',
    alt: ['Unclear instruction or cue', 'Attention or hearing', 'Difficulty locating the muscles', 'Sensor placement'],
    more: ['Review of how the cue is delivered.', 'A practice run with verbal or tactile guidance.', 'Patient-reported difficulty with the exercise.'],
    profile: {
      complaints: ['Leakage on coughing', 'Urgency', 'Unsure whether the exercise is being done correctly'],
      history: ['Two vaginal deliveries', 'Mild memory difficulties', 'Hearing aid user'],
      cog: 0.4,
    },
    exam: { oxford: [2, 4], tone: ['typical'], endurance: [3, 6], reps: [3, 5], fast: [3, 6] },
    spec: (r: () => number) => {
      const miss = r() < 0.6 ? 1 + Math.floor(r() * 4) : -1;
      return {
        dur: DUR,
        bg: 0.04,
        art: ['baseline_drift'],
        artScale: 0.3,
        schedule: rep((k, _R, U) => ({
          delay: U(0.3, 1.25),
          len: U(0.9, 1.1),
          amp: k === miss ? 0.02 : U(0.25, 0.4),
          missed: k === miss,
        })),
      };
    },
    read: (m: any) =>
      'Activity was detected after ' +
      m.detected +
      ' of ' +
      m.n +
      ' cues, with a delay of ' +
      num(m.latMin, ' s') +
      ' to ' +
      num(m.latMax, ' s') +
      '. Delayed activation is a descriptive feature of timing.',
  },
];

export function generateRawCase(seed: number, spec: ScenarioSpec = {}): any {
  const R = rng(seed);
  const U = (a: number, b: number) => a + (b - a) * R();
  const gauss = () =>
    Math.sqrt(-2 * Math.log(R() || 1e-12)) * Math.cos(2 * Math.PI * R());
  const fs = 1000;
  const dur0 = Math.round(U(8, 14) * 2) / 2;
  const dur = spec.dur || dur0;
  const n = fs * dur;
  const t = new Float64Array(n);
  for (let i = 0; i < n; i++) t[i] = i / fs;

  let contr: any[] = [];
  if (spec.schedule) {
    contr = spec.schedule(R, U, dur);
  } else {
    const k = 2 + Math.floor(R() * 4);
    let cur = U(0.8, 1.8);
    for (let j = 0; j < k; j++) {
      const len = U(0.6, 2.0);
      if (cur + len > dur - 0.5) break;
      contr.push({ start_s: cur, end_s: cur + len, simulated_amplitude: U(0.2, 0.5) });
      cur += len + U(0.6, 1.6);
    }
  }

  const bg0 = U(0.03, 0.06);
  const bg = spec.bg || bg0;
  const env = new Float64Array(n).fill(bg);
  const ramp = 0.08;

  contr.forEach((c) => {
    for (
      let i = Math.max(0, Math.floor((c.start_s - ramp) * fs));
      i < Math.min(n, Math.ceil((c.end_s + ramp) * fs));
      i++
    ) {
      const x = t[i];
      const w = Math.min(
        1,
        Math.max(
          0,
          Math.min(
            (x - c.start_s + ramp) / (2 * ramp),
            (c.end_s + ramp - x) / (2 * ramp)
          )
        )
      );
      env[i] = Math.max(
        env[i],
        bg +
          c.simulated_amplitude *
            (1 - (c.decay || 0) * Math.min(1, Math.max(0, (x - c.start_s) / (c.end_s - c.start_s)))) *
            (0.5 - 0.5 * Math.cos(Math.PI * w))
      );
    }
  });

  contr.forEach((c) => {
    if (!c.tail_s) return;
    for (let i = Math.ceil(c.end_s * fs); i < n; i++) {
      env[i] = Math.max(
        env[i],
        bg + c.simulated_amplitude * (c.tail_frac || 0.5) * Math.exp(-(t[i] - c.end_s) / c.tail_s)
      );
    }
  });

  // EMG spiky noise scaled by activity envelope
  const emg = new Float64Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const w = gauss();
    emg[i] = (w - 0.6 * prev) * env[i] * 2.2;
    prev = w;
  }
  const raw = Float64Array.from(emg);
  const pool = [
    'baseline_drift',
    '50_hz_powerline_interference',
    'motion_artifact',
    'simulated_crosstalk',
    'simulated_ecg_contamination',
  ];
  const added = pool.filter(() => R() < 0.7);
  if (spec.art) added.splice(0, added.length, ...spec.art);
  const AS = spec.artScale == null ? 1 : spec.artScale;

  while (added.length < 2 && !spec.art) {
    const a = pool[Math.floor(R() * pool.length)];
    if (!added.includes(a)) added.push(a);
  }

  if (added.includes('baseline_drift')) {
    const A = AS * U(0.2, 0.8),
      f = U(0.1, 0.5),
      ph = U(0, 6.28);
    for (let i = 0; i < n; i++) raw[i] += A * Math.sin(2 * Math.PI * f * t[i] + ph);
  }
  if (added.includes('50_hz_powerline_interference')) {
    const A = AS * U(0.05, 0.25),
      ph = U(0, 6.28);
    for (let i = 0; i < n; i++) raw[i] += A * Math.sin(2 * Math.PI * 50 * t[i] + ph);
  }
  if (added.includes('motion_artifact')) {
    const m = 1 + Math.floor(R() * 3);
    for (let j = 0; j < m; j++) {
      const i0 = Math.floor(U(0.3, dur - 0.8) * fs),
        A = AS * U(0.8, 1.5) * (R() < 0.5 ? -1 : 1);
      for (let i = i0; i < Math.min(n, i0 + 250); i++)
        raw[i] += A * Math.exp(-(i - i0) / 60) * Math.sin((i - i0) / 25);
    }
  }
  if (added.includes('simulated_crosstalk')) {
    const i0 = Math.floor(U(0.5, dur - 1.5) * fs),
      len = Math.floor(U(0.4, 1.0) * fs);
    for (let i = i0; i < Math.min(n, i0 + len); i++) raw[i] += 0.12 * AS * gauss();
  }
  if (added.includes('simulated_ecg_contamination')) {
    const hr = U(0.9, 1.4),
      A = AS * U(0.1, 0.3),
      ph = U(0, 1);
    for (let i = 0; i < n; i++) {
      const x = (((t[i] * hr + ph) % 1) * 1000) / hr;
      raw[i] += A * Math.exp(-((x - 100) ** 2) / 200);
    }
  }

  (spec.dropout || []).forEach(([a, b]) => {
    for (let i = Math.floor(a * fs); i < Math.min(n, Math.floor(b * fs)); i++) raw[i] = 0;
  });

  // Processing: 20 Hz highpass, 50 Hz notch, moving average envelope
  const proc = new Float64Array(n);
  const a = 1 / (2 * Math.PI * 20) / (1 / (2 * Math.PI * 20) + 1 / fs);
  let y = 0,
    xp = raw[0];
  for (let i = 0; i < n; i++) {
    y = a * (y + raw[i] - xp);
    xp = raw[i];
    proc[i] = y;
  }
  const w0 = (2 * Math.PI * 50) / fs;
  const al = Math.sin(w0) / 60;
  const c = -2 * Math.cos(w0);
  const a0 = 1 + al;
  const notch = new Float64Array(n);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < n; i++) {
    const x0 = proc[i];
    const o = (x0 + c * x1 + x2 - (c * y1 + (1 - al) * y2)) / a0;
    notch[i] = o;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = o;
  }
  const half = 75;
  const cs = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) cs[i + 1] = cs[i] + Math.abs(notch[i]);
  const envl = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(n, i + half + 1);
    envl[i] = (1.25 * (cs[hi] - cs[lo])) / (hi - lo);
  }

  return {
    project: 'PelviCoach browser generator',
    mode: 'synthetic_emg',
    seed,
    scenario: 'case ' + seed,
    sampling_rate_original_hz: fs,
    sampling_rate_exported_hz: fs,
    duration_seconds: dur,
    signals: {
      time_s: Array.from(t),
      raw_emg: Array.from(raw),
      processed_emg: Array.from(notch),
      activity_envelope: Array.from(envl),
    },
    simulation_metadata: {
      background_amplitude: bg,
      contractions: contr,
      artifacts_added: added,
    },
  };
}

const meanVal = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

export function analyseScenario(s: NormalizedSession, c: any[]): any {
  const fs = s.meta.sampleRateHz;
  const e = s.envelope;
  const ix = (x: number) => Math.max(0, Math.min(e.length - 1, Math.round(x * fs)));
  const b = Array.from(e.subarray(ix(0.3), ix(1))).sort((x, y) => x - y);
  const rest = b[Math.floor(b.length / 2)] || 0.04;

  const reps = c.map((g, k) => {
    const w0 = ix(g.cue_s || CUE0 + k * PERIOD);
    const w1 = ix(k < c.length - 1 ? (c[k + 1].cue_s || CUE0 + (k + 1) * PERIOD) - 0.05 : DUR - 0.02);
    let pk = 0,
      on = -1;
    for (let i = w0; i <= w1; i++) {
      if (e[i] > pk) pk = e[i];
      if (on < 0 && e[i] >= Math.max(rest, e[w0]) + DET) on = i;
    }
    const r: any = {
      k: k + 1,
      act: pk - rest,
      peak: pk,
      latency: on < 0 ? null : (on - w0) / fs,
      dur: null,
      relax: null,
      endur: null,
    };
    if (on >= 0) {
      const th = rest + 0.5 * r.act;
      let i = on;
      while (i <= w1 && e[i] < th) i++;
      const j0 = i;
      while (i <= w1 && e[i] >= th) i++;
      r.dur = (i - j0) / fs;
      for (let j = ix(g.end_s); j <= w1; j++) {
        if (e[j] <= rest + DET) {
          r.relax = (j - ix(g.end_s)) / fs;
          break;
        }
      }
      const a = ix(g.start_s);
      const z = ix(g.end_s);
      const th3 = Math.floor((z - a) / 3);
      if (th3 > 0) {
        const firstThird = meanVal(Array.from(e.subarray(a, a + th3))) || 1;
        const lastThird = meanVal(Array.from(e.subarray(z - th3, z))) || 0;
        r.endur = (lastThird / firstThird) * 100;
      }
    }
    return r;
  });

  const d = reps.filter((r) => r.latency != null);
  const pk = d.map((r) => r.act);
  const mu = meanVal(pk);
  const sd = pk.length > 1 && mu != null ? Math.sqrt(meanVal(pk.map((x) => (x - mu) ** 2)) || 0) : null;
  const rl = d.filter((r) => r.relax != null);
  const lat = d.map((r) => r.latency);
  const sum = SignalFeedback.summarize(s, SignalFeedback.DEFAULTS);
  const share = sum.flaggedWindows / Math.max(1, sum.windows);

  return {
    rest,
    reps,
    n: c.length,
    detected: d.length,
    peak: mu,
    cv: mu && sd != null ? (sd / mu) * 100 : null,
    lat: meanVal(lat),
    latMin: lat.length ? Math.min(...lat) : null,
    latMax: lat.length ? Math.max(...lat) : null,
    met: d.filter((r) => r.latency <= 0.8).length,
    dur: meanVal(d.map((r) => r.dur).filter((v): v is number => v != null)),
    relax: meanVal(rl.map((r) => r.relax)),
    relaxed: rl.length,
    relaxMissed: d.length - rl.length,
    endur: meanVal(d.map((r) => r.endur).filter((v): v is number => v != null)),
    ratio: mu != null ? rest / (rest + mu) : null,
    flagShare: share,
    quality: share < 0.08 ? 'Good' : share < 0.25 ? 'Limited' : 'Uninterpretable',
  };
}

function generateAbdominal(r: () => number, c: any[], m: any): { e: Float64Array; rise: number; ratio: number; lead: number } {
  const n = DUR * 100;
  const ab = new Float64Array(n);
  const base = 0.1;
  let lead = 0;
  const rise: number[] = [];
  const ramp = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

  c.forEach((g, k) => {
    const l = 0.05 + r() * 0.2;
    const A = (m.reps[k]?.act || 0) * (0.7 + r() * 0.6);
    rise.push(A);
    if (m.reps[k]?.latency != null) lead++;
    for (let i = 0; i < n; i++) {
      const x = i / 100;
      const up = ramp(x, g.start_s - l, g.start_s - l + 0.2);
      const dn = 1 - ramp(x, g.end_s, g.end_s + 0.25);
      ab[i] = Math.max(ab[i], A * up * dn);
    }
  });

  for (let i = 0; i < n; i++) ab[i] += base + (r() - 0.5) * 0.02;
  const meanRise = meanVal(rise) || 0.1;
  return { e: ab, rise: meanRise, ratio: meanRise / (m.peak || 0.1), lead };
}

function generateProfile(sc: ScenarioDefinition, r: () => number, seed: number) {
  const ri = ([a, b]: [number, number]) => Math.round(a + (b - a) * r());
  const has = (p: number) => r() < p;
  const ex = sc.exam;
  return {
    id: 'PF-' + (1000 + (seed % 9000)),
    age: ri([66, 84]),
    session: ri([1, 8]),
    complaint: pick(r, sc.profile.complaints),
    duration: pick(r, ['under 6 months', '6 to 12 months', '1 to 3 years', 'more than 3 years']),
    history: pick(r, sc.profile.history),
    mobility: pick(r, ['Independent', 'Independent', 'Uses a walking stick', 'Uses a walking frame']),
    cognition: has(0.9) ? (has(sc.profile.cog) ? 'Follows instructions' : 'Needs repeated instructions') : 'Unknown',
    comorbid: has(0.85) ? pick(r, ['None recorded', 'Hypertension', 'Type 2 diabetes', 'Osteoarthritis', 'Chronic cough']) : 'Unknown',
    oxford: has(0.8) ? ri(ex.oxford) : null,
    tone: has(0.75) ? pick(r, ex.tone) : null,
    endurance: has(0.7) ? ri(ex.endurance) : null,
    reps: has(0.7) ? ri(ex.reps) : null,
    fast: has(0.7) ? ri(ex.fast) : null,
  };
}

export function generateScenarioCase(key: string, seed: number): ParseResult {
  const sc = SCENARIOS.find((x) => x.key === key) || SCENARIOS[0];
  const r = rng(seed ^ 0x9e3779b9);
  const spec = sc.spec(r);
  const raw = generateRawCase(seed, spec);
  raw.project = 'PelviCoach Scenario Case Generator';
  raw.scenario = sc.id + ' ' + sc.name;

  const res = parseSession(raw, sc.id + ', seed ' + seed);
  if (!res.ok || !res.session) return res;

  const s = res.session;
  const c = raw.simulation_metadata.contractions;
  const m = analyseScenario(s, c);
  const prof = generateProfile(sc, r, seed);

  if (sc.abdominal) {
    const a = generateAbdominal(r, c, m);
    m.abdRise = a.rise;
    m.abdRatio = a.ratio;
    m.abdLead = a.lead;
    s.abd = a.e;
  }

  s.clin = {
    sc,
    seed,
    m,
    prof,
    art: raw.simulation_metadata.artifacts_added,
    dropout: spec.dropout || [],
  };

  return res;
}
