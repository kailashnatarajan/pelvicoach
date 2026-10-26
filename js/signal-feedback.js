/* signal-feedback.js
 * Signal-processing + feedback module. Pure functions, no DOM.
 * ILLUSTRATIVE ONLY: every threshold below is an adjustable demo value, not a clinical
 * criterion. Output describes signal quality and amplitude relative to a user-set level.
 * It does NOT diagnose, grade, or assess any pelvic-floor condition.
 */
(function (root) {
  const DISCLAIMER = 'Illustrative rules on synthetic data. Not clinically validated. Not a diagnosis.';
  const DEFAULTS = Object.freeze({
    windowMs: 250,          // analysis window length
    activityFraction: 0.5,  // "active" if window mean envelope >= fraction x session reference level
    mainsHz: 50,            // 50 or 60
    mainsFractionMax: 0.35, // flag if this share of raw power sits at the mains frequency
    flatStdMax: 0.005,      // flag "flat" if raw std-dev is below this (lift-off style)
    clipAbs: 5,             // |raw| at or above this counts as clipped
    clipFractionMax: 0.05   // flag if more than this share of window is clipped
  });
  const QUALITY_TEXT = {
    ok: 'Signal quality rules: no flag',
    insufficient: 'Collecting the first analysis window. Move the replay forward.',
    flat: 'Flagged: near-flat raw signal (possible electrode lift-off)',
    clipped: 'Flagged: clipped samples',
    line_interference: 'Flagged: strong mains-frequency component'
  };

  function rms(a, i0, i1) { let s = 0; for (let i = i0; i < i1; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, i1 - i0)); }
  function mean(a, i0, i1) { let s = 0; for (let i = i0; i < i1; i++) s += a[i]; return s / Math.max(1, i1 - i0); }
  function std(a, i0, i1) { const m = mean(a, i0, i1); let s = 0; for (let i = i0; i < i1; i++) s += (a[i] - m) ** 2; return Math.sqrt(s / Math.max(1, i1 - i0)); }
  function quantile(a, q) { const c = Array.from(a).sort((x, y) => x - y); return c.length ? c[Math.min(c.length - 1, Math.floor(q * c.length))] : 0; }

  /** Share of (mean-removed) signal power at one frequency, via the Goertzel algorithm. */
  function freqPowerFraction(a, i0, i1, fs, f) {
    const n = i1 - i0; if (n < 8) return 0;
    const m = mean(a, i0, i1), w = 2 * Math.PI * f / fs, c = 2 * Math.cos(w);
    let s1 = 0, s2 = 0, tot = 0;
    for (let i = i0; i < i1; i++) { const x = a[i] - m; tot += x * x; const s0 = x + c * s1 - s2; s2 = s1; s1 = s0; }
    if (tot <= 0) return 0;
    const p = s1 * s1 + s2 * s2 - c * s1 * s2;        // |X(f)|^2
    return Math.min(1, 2 * p / n / tot);              // (A^2/2)/meanSquare with A = 2|X|/n
  }

  /** Predefined features for samples [i0, i1). */
  function windowFeatures(s, i0, i1, cfg) {
    const fs = s.meta.sampleRateHz; let clip = 0;
    for (let i = i0; i < i1; i++) if (Math.abs(s.raw[i]) >= cfg.clipAbs) clip++;
    let envMax = 0; for (let i = i0; i < i1; i++) if (s.envelope[i] > envMax) envMax = s.envelope[i];
    return { rawRms: rms(s.raw, i0, i1), processedRms: rms(s.processed, i0, i1), rawStd: std(s.raw, i0, i1),
      envMean: mean(s.envelope, i0, i1), envMax, clipFraction: clip / Math.max(1, i1 - i0),
      mainsFraction: freqPowerFraction(s.raw, i0, i1, fs, cfg.mainsHz), samples: i1 - i0 };
  }

  /** Apply the configurable quality rules, then the amplitude-level rule on valid windows only. */
  function evaluate(f, cfg, refLevel) {
    let quality = 'ok';
    if (f.samples < 8) quality = 'insufficient';
    else if (f.rawStd < cfg.flatStdMax) quality = 'flat';
    else if (f.clipFraction > cfg.clipFractionMax) quality = 'clipped';
    else if (f.mainsFraction > cfg.mainsFractionMax) quality = 'line_interference';
    const thr = cfg.activityFraction * refLevel;
    const level = quality === 'insufficient' ? 'waiting' : quality !== 'ok' ? 'unscored' : f.envMean >= thr ? 'above' : 'below';
    return { quality, qualityText: QUALITY_TEXT[quality], level, threshold: thr,
      levelText: level === 'waiting' ? 'Waiting for a full analysis window' : level === 'unscored' ? 'Not scored (signal quality flag)'
        : level === 'above' ? 'Envelope above the illustrative level' : 'Envelope below the illustrative level' };
  }

  function indexAt(s, tSec) { return Math.max(0, Math.min(s.t.length - 1, Math.round((tSec - s.t[0]) * s.meta.sampleRateHz))); }

  /** Feedback for the window ending at time tSec. */
  function feedbackAt(s, tSec, cfg, refLevel) {
    const n = Math.max(1, Math.round(cfg.windowMs / 1000 * s.meta.sampleRateHz)), i1 = indexAt(s, tSec) + 1, i0 = Math.max(0, i1 - n);
    const f = windowFeatures(s, i0, i1, cfg); if (i1 - i0 < n && i0 === 0) f.samples = 0; return Object.assign({ features: f }, evaluate(f, cfg, refLevel));
  }

  /** Whole-session summary: global features, flagged-window share, and segments above the level. */
  function summarize(s, cfg) {
    const n = s.t.length, ref = quantile(s.envelope, 0.95), base = quantile(s.envelope, 0.5), thr = cfg.activityFraction * ref;
    const step = Math.max(1, Math.round(cfg.windowMs / 1000 * s.meta.sampleRateHz)); let wins = 0, flagged = 0;
    const segs = []; let open = null;
    for (let i0 = 0; i0 + step <= n; i0 += step) {
      const f = windowFeatures(s, i0, i0 + step, cfg), e = evaluate(f, cfg, ref); wins++;
      if (e.quality !== 'ok') flagged++;
      const t0 = s.t[i0], t1 = s.t[i0 + step - 1];
      if (e.level === 'above') { if (open) open.end = t1; else segs.push(open = { start: t0, end: t1 }); } else open = null;
    }
    return { refLevel: ref, baselineLevel: base, threshold: thr, peakToBaseline: base > 0 ? Math.max(...s.envelope) / base : null,
      rawRms: rms(s.raw, 0, n), processedRms: rms(s.processed, 0, n), envelopePeak: Math.max(...s.envelope),
      windows: wins, flaggedWindows: flagged, segments: segs };
  }
  root.SignalFeedback = { DEFAULTS, DISCLAIMER, QUALITY_TEXT, windowFeatures, evaluate, feedbackAt, summarize, indexAt };
  if (typeof module !== 'undefined') module.exports = root.SignalFeedback;
})(typeof window !== 'undefined' ? window : globalThis);
