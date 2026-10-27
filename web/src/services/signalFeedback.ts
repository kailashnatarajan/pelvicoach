/* signalFeedback.ts
 * Signal processing & window evaluation for PelviCoach.
 * Pure mathematical functions for RMS, Goertzel power share, std dev, and rule feedback.
 */

import { NormalizedSession } from './sessionSchema';

export const DISCLAIMER = 'Illustrative rules on synthetic data. Not clinically validated. Not a diagnosis.';

export interface FeedbackConfig {
  windowMs: number;          // analysis window length (default 250)
  activityFraction: number;  // fraction of reference level (default 0.5)
  mainsHz: number;            // 50 or 60 Hz
  mainsFractionMax: number; // flag if mains power share > this (default 0.35)
  flatStdMax: number;       // flag flat if raw std < this (default 0.005)
  clipAbs: number;          // abs raw >= this is clipped (default 5.0)
  clipFractionMax: number;  // flag clipped if fraction > this (default 0.05)
}

export const DEFAULTS: FeedbackConfig = Object.freeze({
  windowMs: 250,
  activityFraction: 0.5,
  mainsHz: 50,
  mainsFractionMax: 0.35,
  flatStdMax: 0.005,
  clipAbs: 5,
  clipFractionMax: 0.05,
});

export const QUALITY_TEXT: Record<string, string> = {
  ok: 'Signal quality rules: no flag (Clean)',
  insufficient: 'Collecting the first analysis window...',
  flat: 'Flagged: near-flat raw signal (possible electrode lift-off)',
  clipped: 'Flagged: clipped samples (amplifier saturation)',
  line_interference: 'Flagged: strong mains-frequency component (50/60 Hz noise)',
};

export interface WindowFeatures {
  rawRms: number;
  processedRms: number;
  rawStd: number;
  envMean: number;
  envMax: number;
  clipFraction: number;
  mainsFraction: number;
  samples: number;
}

export interface WindowEvaluation {
  quality: 'ok' | 'insufficient' | 'flat' | 'clipped' | 'line_interference';
  qualityText: string;
  level: 'waiting' | 'unscored' | 'above' | 'below';
  threshold: number;
  levelText: string;
}

export interface FeedbackResult extends WindowEvaluation {
  features: WindowFeatures;
}

export interface SessionSummary {
  refLevel: number;
  baselineLevel: number;
  threshold: number;
  peakToBaseline: number | null;
  rawRms: number;
  processedRms: number;
  envelopePeak: number;
  windows: number;
  flaggedWindows: number;
  segments: Array<{ start: number; end: number }>;
}

export function rms(a: Float64Array, i0: number, i1: number): number {
  let s = 0;
  for (let i = i0; i < i1; i++) s += a[i] * a[i];
  return Math.sqrt(s / Math.max(1, i1 - i0));
}

export function mean(a: Float64Array, i0: number, i1: number): number {
  let s = 0;
  for (let i = i0; i < i1; i++) s += a[i];
  return s / Math.max(1, i1 - i0);
}

export function std(a: Float64Array, i0: number, i1: number): number {
  const m = mean(a, i0, i1);
  let s = 0;
  for (let i = i0; i < i1; i++) s += (a[i] - m) ** 2;
  return Math.sqrt(s / Math.max(1, i1 - i0));
}

export function quantile(a: Float64Array, q: number): number {
  const c = Array.from(a).sort((x, y) => x - y);
  return c.length ? c[Math.min(c.length - 1, Math.floor(q * c.length))] : 0;
}

/** Share of signal power at a target frequency via Goertzel algorithm */
export function freqPowerFraction(a: Float64Array, i0: number, i1: number, fs: number, f: number): number {
  const n = i1 - i0;
  if (n < 8) return 0;
  const m = mean(a, i0, i1);
  const w = (2 * Math.PI * f) / fs;
  const c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0, tot = 0;
  for (let i = i0; i < i1; i++) {
    const x = a[i] - m;
    tot += x * x;
    const s0 = x + c * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  if (tot <= 0) return 0;
  const p = s1 * s1 + s2 * s2 - c * s1 * s2;
  return Math.min(1, (2 * p) / n / tot);
}

export function windowFeatures(s: NormalizedSession, i0: number, i1: number, cfg: FeedbackConfig): WindowFeatures {
  const fs = s.meta.sampleRateHz;
  let clip = 0;
  for (let i = i0; i < i1; i++) {
    if (Math.abs(s.raw[i]) >= cfg.clipAbs) clip++;
  }
  let envMax = 0;
  for (let i = i0; i < i1; i++) {
    if (s.envelope[i] > envMax) envMax = s.envelope[i];
  }
  return {
    rawRms: rms(s.raw, i0, i1),
    processedRms: rms(s.processed, i0, i1),
    rawStd: std(s.raw, i0, i1),
    envMean: mean(s.envelope, i0, i1),
    envMax,
    clipFraction: clip / Math.max(1, i1 - i0),
    mainsFraction: freqPowerFraction(s.raw, i0, i1, fs, cfg.mainsHz),
    samples: i1 - i0,
  };
}

export function evaluate(f: WindowFeatures, cfg: FeedbackConfig, refLevel: number): WindowEvaluation {
  let quality: WindowEvaluation['quality'] = 'ok';
  if (f.samples < 8) quality = 'insufficient';
  else if (f.rawStd < cfg.flatStdMax) quality = 'flat';
  else if (f.clipFraction > cfg.clipFractionMax) quality = 'clipped';
  else if (f.mainsFraction > cfg.mainsFractionMax) quality = 'line_interference';

  const thr = cfg.activityFraction * refLevel;
  const level: WindowEvaluation['level'] =
    quality === 'insufficient'
      ? 'waiting'
      : quality !== 'ok'
      ? 'unscored'
      : f.envMean >= thr
      ? 'above'
      : 'below';

  return {
    quality,
    qualityText: QUALITY_TEXT[quality] || 'Unknown quality',
    level,
    threshold: thr,
    levelText:
      level === 'waiting'
        ? 'Waiting for a full analysis window'
        : level === 'unscored'
        ? 'Not scored (signal quality flag)'
        : level === 'above'
        ? 'Envelope above illustrative level'
        : 'Envelope below illustrative level',
  };
}

export function indexAt(s: NormalizedSession, tSec: number): number {
  return Math.max(0, Math.min(s.t.length - 1, Math.round((tSec - s.t[0]) * s.meta.sampleRateHz)));
}

export function feedbackAt(s: NormalizedSession, tSec: number, cfg: FeedbackConfig, refLevel: number): FeedbackResult {
  const n = Math.max(1, Math.round((cfg.windowMs / 1000) * s.meta.sampleRateHz));
  const i1 = indexAt(s, tSec) + 1;
  const i0 = Math.max(0, i1 - n);
  const f = windowFeatures(s, i0, i1, cfg);
  if (i1 - i0 < n && i0 === 0) f.samples = 0;
  return {
    features: f,
    ...evaluate(f, cfg, refLevel),
  };
}

export function summarize(s: NormalizedSession, cfg: FeedbackConfig): SessionSummary {
  const n = s.t.length;
  const ref = quantile(s.envelope, 0.95);
  const base = quantile(s.envelope, 0.5);
  const thr = cfg.activityFraction * ref;
  const step = Math.max(1, Math.round((cfg.windowMs / 1000) * s.meta.sampleRateHz));
  let wins = 0, flagged = 0;
  const segs: Array<{ start: number; end: number }> = [];
  let open: { start: number; end: number } | null = null;

  for (let i0 = 0; i0 + step <= n; i0 += step) {
    const f = windowFeatures(s, i0, i0 + step, cfg);
    const e = evaluate(f, cfg, ref);
    wins++;
    if (e.quality !== 'ok') flagged++;
    const t0 = s.t[i0];
    const t1 = s.t[i0 + step - 1];
    if (e.level === 'above') {
      if (open) open.end = t1;
      else segs.push((open = { start: t0, end: t1 }));
    } else {
      open = null;
    }
  }

  let envMax = 0;
  for (let i = 0; i < s.envelope.length; i++) {
    if (s.envelope[i] > envMax) envMax = s.envelope[i];
  }

  return {
    refLevel: ref,
    baselineLevel: base,
    threshold: thr,
    peakToBaseline: base > 0 ? envMax / base : null,
    rawRms: rms(s.raw, 0, n),
    processedRms: rms(s.processed, 0, n),
    envelopePeak: envMax,
    windows: wins,
    flaggedWindows: flagged,
    segments: segs,
  };
}
