/* case-generator.js
 * In-browser generator of RANDOM SYNTHETIC EMG-like cases, in the same shape as the Colab export.
 * Illustrative approximation only: it is NOT the Colab notebook's algorithm and models no real person.
 * Each case is reproducible from its seed. Registers itself as a data-source adapter.
 */
(function (root) {
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function generate(seed) {
    const R = rng(seed), U = (a, b) => a + (b - a) * R(), gauss = () => Math.sqrt(-2 * Math.log(R() || 1e-12)) * Math.cos(2 * Math.PI * R());
    const fs = 1000, dur = Math.round(U(8, 14) * 2) / 2, n = fs * dur, t = new Float64Array(n);
    for (let i = 0; i < n; i++) t[i] = i / fs;

    // contraction schedule (random count, timing, length, amplitude)
    const k = 2 + Math.floor(R() * 4), contr = []; let cur = U(0.8, 1.8);
    for (let j = 0; j < k; j++) { const len = U(0.6, 2.0); if (cur + len > dur - 0.5) break; contr.push({ start_s: cur, end_s: cur + len, simulated_amplitude: U(0.2, 0.5) }); cur += len + U(0.6, 1.6); }
    const bg = U(0.03, 0.06), env = new Float64Array(n).fill(bg), ramp = 0.08;
    contr.forEach(c => { for (let i = Math.max(0, Math.floor((c.start_s - ramp) * fs)); i < Math.min(n, Math.ceil((c.end_s + ramp) * fs)); i++) { const x = t[i], w = Math.min(1, Math.max(0, Math.min((x - c.start_s + ramp) / (2 * ramp), (c.end_s + ramp - x) / (2 * ramp)))); env[i] = Math.max(env[i], bg + c.simulated_amplitude * (0.5 - 0.5 * Math.cos(Math.PI * w))); } });

    // muscle-like signal: spiky noise scaled by the activity profile
    const emg = new Float64Array(n); let prev = 0;
    for (let i = 0; i < n; i++) { const w = gauss(); emg[i] = (w - 0.6 * prev) * env[i] * 2.2; prev = w; }
    const raw = Float64Array.from(emg), pool = ['baseline_drift', '50_hz_powerline_interference', 'motion_artifact', 'simulated_crosstalk', 'simulated_ecg_contamination'];
    const added = pool.filter(() => R() < 0.7); while (added.length < 2) { const a = pool[Math.floor(R() * pool.length)]; if (!added.includes(a)) added.push(a); }
    if (added.includes('baseline_drift')) { const A = U(0.2, 0.8), f = U(0.1, 0.5), ph = U(0, 6.28); for (let i = 0; i < n; i++) raw[i] += A * Math.sin(2 * Math.PI * f * t[i] + ph); }
    if (added.includes('50_hz_powerline_interference')) { const A = U(0.05, 0.25), ph = U(0, 6.28); for (let i = 0; i < n; i++) raw[i] += A * Math.sin(2 * Math.PI * 50 * t[i] + ph); }
    if (added.includes('motion_artifact')) { const m = 1 + Math.floor(R() * 3); for (let j = 0; j < m; j++) { const i0 = Math.floor(U(0.3, dur - 0.8) * fs), A = U(0.8, 1.5) * (R() < .5 ? -1 : 1); for (let i = i0; i < Math.min(n, i0 + 250); i++) raw[i] += A * Math.exp(-(i - i0) / 60) * Math.sin((i - i0) / 25); } }
    if (added.includes('simulated_crosstalk')) { const i0 = Math.floor(U(0.5, dur - 1.5) * fs), len = Math.floor(U(0.4, 1.0) * fs); for (let i = i0; i < Math.min(n, i0 + len); i++) raw[i] += 0.12 * gauss(); }
    if (added.includes('simulated_ecg_contamination')) { const hr = U(0.9, 1.4), A = U(0.1, 0.3), ph = U(0, 1); for (let i = 0; i < n; i++) { const x = ((t[i] * hr + ph) % 1) * 1000 / hr; raw[i] += A * Math.exp(-((x - 100) ** 2) / 200); } }

    // illustrative processing chain: 20 Hz high-pass, 50 Hz notch, then rectified moving-average envelope
    const proc = new Float64Array(n), a = (1 / (2 * Math.PI * 20)) / (1 / (2 * Math.PI * 20) + 1 / fs); let y = 0, xp = raw[0];
    for (let i = 0; i < n; i++) { y = a * (y + raw[i] - xp); xp = raw[i]; proc[i] = y; }
    const w0 = 2 * Math.PI * 50 / fs, al = Math.sin(w0) / 60, c = -2 * Math.cos(w0), a0 = 1 + al, notch = new Float64Array(n); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < n; i++) { const x0 = proc[i], o = (x0 + c * x1 + x2 - (c * y1 + (1 - al) * y2)) / a0; notch[i] = o; x2 = x1; x1 = x0; y2 = y1; y1 = o; }
    const half = 75, cs = new Float64Array(n + 1); for (let i = 0; i < n; i++) cs[i + 1] = cs[i] + Math.abs(notch[i]);
    const envl = new Float64Array(n); for (let i = 0; i < n; i++) { const lo = Math.max(0, i - half), hi = Math.min(n, i + half + 1); envl[i] = 1.25 * (cs[hi] - cs[lo]) / (hi - lo); }

    return { project: 'PelviCoach browser generator', mode: 'synthetic_emg', seed, scenario: 'random case ' + seed + ' (generated in this browser)',
      sampling_rate_original_hz: fs, sampling_rate_exported_hz: fs, duration_seconds: dur,
      signals: { time_s: Array.from(t), raw_emg: Array.from(raw), processed_emg: Array.from(notch), activity_envelope: Array.from(envl) },
      simulation_metadata: { background_amplitude: bg, contractions: contr, artifacts_added: added } };
  }

  DataSources.register({ id: 'random-synthetic', label: 'Random synthetic case (generated in browser)', kind: 'file',
    load(opts) { const seed = opts && Number.isFinite(opts.seed) ? opts.seed >>> 0 : Math.floor(Math.random() * 4294967296) >>> 0;
      const r = SessionSchema.parseSession(generate(seed), 'random case, seed ' + seed); if (r.ok) r.warnings.push('Generated in this browser by an illustrative simulator. It is not the Colab notebook\'s output. Reload the same seed to get the same case.'); return Promise.resolve(r); } });
  root.CaseGenerator = { generate };
})(window);
