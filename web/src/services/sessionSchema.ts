/* sessionSchema.ts
 * Parses + validates synthetic EMG sessions (Colab JSON / in-browser generation)
 * into a normalized Session structure.
 */

export interface SessionMetadata {
  project: string;
  mode: string;
  sampleRateHz: number;
  originalRateHz?: number | null;
  durationS: number;
  seed?: number | string;
  scenario?: string;
  backgroundAmplitude?: number | null;
  artifacts: string[];
}

export interface ContractionInterval {
  start: number;
  end: number;
  amplitude?: number | null;
  cue_s?: number;
  delay?: number;
  len?: number;
  decay?: number;
}

export interface NormalizedSession {
  meta: SessionMetadata;
  t: Float64Array;
  raw: Float64Array;
  processed: Float64Array;
  envelope: Float64Array;
  contractions: ContractionInterval[];
  source: {
    kind: string;
    label: string;
    size?: number;
    modified?: number;
  };
  abd?: Float64Array;
  fp?: string;
  sameAsPrev?: boolean;
  clin?: any;
}

export interface ParseResult {
  ok: boolean;
  session?: NormalizedSession;
  errors: string[];
  warnings: string[];
}

export const LIMITS = { maxBytes: 50e6, maxSamples: 1e6 };
const SIGNALS = ['time_s', 'raw_emg', 'processed_emg', 'activity_envelope'] as const;
const isNum = (v: any): v is number => typeof v === 'number' && isFinite(v);

export function parseSession(text: string | object, sourceLabel: string = 'local file'): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fail = (m: string): ParseResult => {
    errors.push(m);
    return { ok: false, errors, warnings };
  };

  let d: any;
  try {
    d = typeof text === 'string' ? JSON.parse(text) : text;
  } catch (e: any) {
    const rawStr = typeof text === 'string' ? text : '';
    const hint = /\b(NaN|-?Infinity)\b/.test(rawStr.slice(0, 5e6))
      ? ' The file contains NaN or Infinity, which standard JSON does not permit.'
      : '';
    return fail('This file is not valid JSON (' + (e?.message || 'parse error') + ').' + hint);
  }

  if (!d || typeof d !== 'object' || Array.isArray(d)) {
    return fail('The top level of the file must be a JSON object.');
  }

  // Safety check: only load synthetic mode
  if (d.mode === undefined) {
    warnings.push('Field "mode" is missing. Treated as synthetic.');
  } else if (!/synthetic/i.test(String(d.mode))) {
    return fail('Field "mode" is "' + d.mode + '". This platform only loads sessions whose mode contains "synthetic".');
  }

  const sg = d.signals;
  if (!sg || typeof sg !== 'object') {
    return fail('Missing "signals" object.');
  }

  const missing = SIGNALS.filter(k => !Array.isArray(sg[k]));
  if (missing.length) {
    return fail('Missing or non-array signal field(s): ' + missing.join(', ') + '.');
  }

  const lens = SIGNALS.map(k => sg[k].length);
  if (new Set(lens).size > 1) {
    return fail('Signal arrays have different lengths: ' + SIGNALS.map((k, i) => k + '=' + lens[i]).join(', ') + '.');
  }

  const n = lens[0];
  if (n < 2) return fail('Signals need at least 2 samples.');
  if (n > LIMITS.maxSamples) return fail('Too many samples (' + n + '). Limit is ' + LIMITS.maxSamples + '.');

  const arr: Record<string, Float64Array> = {};
  for (const k of SIGNALS) {
    const a = new Float64Array(n);
    const src = sg[k];
    for (let i = 0; i < n; i++) {
      if (!isNum(src[i])) {
        return fail('"' + k + '" has a non-numeric or non-finite value at index ' + i + '.');
      }
      a[i] = src[i];
    }
    arr[k] = a;
  }

  const t = arr.time_s;
  for (let i = 1; i < n; i++) {
    if (!(t[i] > t[i - 1])) {
      return fail('"time_s" must be strictly increasing (problem at index ' + i + ').');
    }
  }

  const derivedHz = (n - 1) / (t[n - 1] - t[0]);
  let hz = d.sampling_rate_exported_hz;
  if (hz === undefined) {
    hz = derivedHz;
    warnings.push('"sampling_rate_exported_hz" is missing. Using ' + hz.toFixed(1) + ' Hz derived from time_s.');
  } else if (!isNum(hz) || hz <= 0) {
    return fail('"sampling_rate_exported_hz" must be a positive number.');
  } else if (Math.abs(hz - derivedHz) / hz > 0.02) {
    warnings.push('Stated sample rate (' + hz + ' Hz) differs from the rate implied by time_s (' + derivedHz.toFixed(1) + ' Hz).');
  }

  const durationS = t[n - 1] - t[0] + 1 / hz;
  if (isNum(d.duration_seconds) && Math.abs(d.duration_seconds - durationS) > 0.05 * d.duration_seconds) {
    warnings.push('"duration_seconds" (' + d.duration_seconds + ') does not match the signal length (' + durationS.toFixed(2) + ' s).');
  }

  const md = d.simulation_metadata;
  const contractions: ContractionInterval[] = [];
  if (!md || typeof md !== 'object') {
    warnings.push('"simulation_metadata" is missing. No contraction intervals can be shown.');
  } else if (!Array.isArray(md.contractions)) {
    warnings.push('"simulation_metadata.contractions" is missing. No contraction intervals can be shown.');
  } else {
    md.contractions.forEach((c: any, i: number) => {
      if (c && isNum(c.start_s) && isNum(c.end_s) && c.end_s > c.start_s) {
        contractions.push({
          start: c.start_s,
          end: c.end_s,
          amplitude: isNum(c.simulated_amplitude) ? c.simulated_amplitude : null,
          cue_s: c.cue_s,
          delay: c.delay,
          len: c.len,
          decay: c.decay
        });
      } else {
        warnings.push('Contraction #' + (i + 1) + ' is malformed and was skipped.');
      }
    });
  }

  return {
    ok: true,
    errors,
    warnings,
    session: {
      meta: {
        project: String(d.project || 'PelviCoach System'),
        mode: d.mode || 'synthetic_emg',
        sampleRateHz: hz,
        originalRateHz: isNum(d.sampling_rate_original_hz) ? d.sampling_rate_original_hz : null,
        durationS,
        seed: d.seed !== undefined ? d.seed : d.random_seed,
        scenario: d.scenario !== undefined ? d.scenario : d.case_name,
        backgroundAmplitude: md && isNum(md.background_amplitude) ? md.background_amplitude : null,
        artifacts: md && Array.isArray(md.artifacts_added) ? md.artifacts_added.map(String) : []
      },
      t,
      raw: arr.raw_emg,
      processed: arr.processed_emg,
      envelope: arr.activity_envelope,
      contractions,
      source: { kind: 'file', label: sourceLabel || 'local file' }
    }
  };
}
