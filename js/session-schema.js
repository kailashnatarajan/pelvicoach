/* session-schema.js
 * Parses + validates a Colab-exported synthetic EMG session and converts it to the
 * normalized Session object used by the whole UI. No DOM access here.
 *
 * Normalized Session (the ONLY shape the UI consumes; future adapters must produce it):
 * { meta:{project,mode,sampleRateHz,originalRateHz,durationS,backgroundAmplitude,artifacts[]},
 *   t:Float64Array, raw:Float64Array, processed:Float64Array, envelope:Float64Array,
 *   contractions:[{start,end,amplitude}], source:{kind,label} }
 */
(function (root) {
  const LIMITS = { maxBytes: 50e6, maxSamples: 1e6 };
  const SIGNALS = ['time_s', 'raw_emg', 'processed_emg', 'activity_envelope'];
  const isNum = v => typeof v === 'number' && isFinite(v);

  /** @returns {{ok:boolean, session?:object, errors:string[], warnings:string[]}} */
  function parseSession(text, sourceLabel) {
    const errors = [], warnings = [];
    const fail = m => { errors.push(m); return { ok: false, errors, warnings }; };
    let d;
    try { d = typeof text === 'string' ? JSON.parse(text) : text; } catch (e) {
      const hint = /\b(NaN|-?Infinity)\b/.test(text.slice(0, 5e6)) ? ' The file contains NaN or Infinity, which JSON does not allow. In the notebook, clean the arrays (for example np.nan_to_num) or export with json.dump(..., allow_nan=False) to find the bad values.' : '';
      return fail('This file is not valid JSON (' + e.message + ').' + hint); }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return fail('The top level of the file must be a JSON object.');

    // Safety gate: this prototype only accepts data that declares itself synthetic.
    if (d.mode === undefined) warnings.push('Field "mode" is missing. The file is treated as synthetic, but it cannot be confirmed.');
    else if (!/synthetic/i.test(String(d.mode))) return fail('Field "mode" is "' + d.mode + '". This prototype only loads sessions whose mode contains "synthetic" (for example "synthetic_emg").');

    const sg = d.signals;
    if (!sg || typeof sg !== 'object') return fail('Missing "signals" object.');
    const missing = SIGNALS.filter(k => !Array.isArray(sg[k]));
    if (missing.length) return fail('Missing or non-array signal field(s): ' + missing.join(', ') + '.');

    const lens = SIGNALS.map(k => sg[k].length);
    if (new Set(lens).size > 1) return fail('Signal arrays have different lengths: ' + SIGNALS.map((k, i) => k + '=' + lens[i]).join(', ') + '.');
    const n = lens[0];
    if (n < 2) return fail('Signals need at least 2 samples.');
    if (n > LIMITS.maxSamples) return fail('Too many samples (' + n + '). Limit is ' + LIMITS.maxSamples + '.');

    const arr = {};
    for (const k of SIGNALS) {
      const a = new Float64Array(n); const src = sg[k];
      for (let i = 0; i < n; i++) {
        if (!isNum(src[i])) return fail('"' + k + '" has a non-numeric or non-finite value at index ' + i + '.');
        a[i] = src[i];
      }
      arr[k] = a;
    }
    const t = arr.time_s;
    for (let i = 1; i < n; i++) if (!(t[i] > t[i - 1])) return fail('"time_s" must be strictly increasing (problem at index ' + i + ').');

    const derivedHz = (n - 1) / (t[n - 1] - t[0]);
    let hz = d.sampling_rate_exported_hz;
    if (hz === undefined) { hz = derivedHz; warnings.push('"sampling_rate_exported_hz" is missing. Using ' + hz.toFixed(1) + ' Hz derived from time_s.'); }
    else if (!isNum(hz) || hz <= 0) return fail('"sampling_rate_exported_hz" must be a positive number.');
    else if (Math.abs(hz - derivedHz) / hz > 0.02) warnings.push('Stated sample rate (' + hz + ' Hz) differs from the rate implied by time_s (' + derivedHz.toFixed(1) + ' Hz). The stated rate is used for feature calculation.');

    const durationS = t[n - 1] - t[0] + 1 / hz;
    if (isNum(d.duration_seconds) && Math.abs(d.duration_seconds - durationS) > 0.05 * d.duration_seconds)
      warnings.push('"duration_seconds" (' + d.duration_seconds + ') does not match the signal length (' + durationS.toFixed(2) + ' s).');

    const md = d.simulation_metadata, contractions = [];
    if (!md || typeof md !== 'object') warnings.push('"simulation_metadata" is missing. No contraction intervals can be shown.');
    else if (!Array.isArray(md.contractions)) warnings.push('"simulation_metadata.contractions" is missing. No contraction intervals can be shown.');
    else md.contractions.forEach((c, i) => {
      if (c && isNum(c.start_s) && isNum(c.end_s) && c.end_s > c.start_s)
        contractions.push({ start: c.start_s, end: c.end_s, amplitude: isNum(c.simulated_amplitude) ? c.simulated_amplitude : null });
      else warnings.push('Contraction #' + (i + 1) + ' is malformed and was skipped.');
    });

    return { ok: true, errors, warnings, session: {
      meta: { project: String(d.project || 'unknown'), mode: d.mode || 'unconfirmed', sampleRateHz: hz,
        originalRateHz: isNum(d.sampling_rate_original_hz) ? d.sampling_rate_original_hz : null, durationS,
        seed: d.seed !== undefined ? d.seed : d.random_seed, scenario: d.scenario !== undefined ? d.scenario : d.case_name,
        backgroundAmplitude: md && isNum(md.background_amplitude) ? md.background_amplitude : null,
        artifacts: md && Array.isArray(md.artifacts_added) ? md.artifacts_added.map(String) : [] },
      t, raw: arr.raw_emg, processed: arr.processed_emg, envelope: arr.activity_envelope,
      contractions, source: { kind: 'file', label: sourceLabel || 'local file' } } };
  }
  root.SessionSchema = { parseSession, LIMITS };
  if (typeof module !== 'undefined') module.exports = root.SessionSchema;
})(typeof window !== 'undefined' ? window : globalThis);
