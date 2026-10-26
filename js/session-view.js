/* session-view.js
 * UI for imported synthetic sessions: file picker, metadata, three interactive charts,
 * replay controls, rule settings. Depends on DataSources + SignalFeedback.
 * Replay is a playhead moving through a stored file. It is not a live sensor recording.
 */
(function () {
  const $ = s => document.querySelector(s), SF = SignalFeedback;
  const CH = [{ key: 'raw', title: 'Raw contaminated EMG', col: '--c-raw' }, { key: 'processed', title: 'Processed EMG', col: '--acc' },
              { key: 'envelope', title: 'Extracted activity envelope', col: '--c-env' }];
  const V = { s: null, cfg: Object.assign({}, SF.DEFAULTS), sum: null, pos: 0, play: false, speed: 1, last: 0, hover: null, cache: {}, ranges: {} };
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const f3 = v => (Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2)), esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function show(errors, warnings) {
    $('#sxMsg').innerHTML = (errors.length ? '<div class="sx-err" role="alert"><b>Could not load this file.</b><ul>' + errors.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul>Choose a JSON file exported from the Colab notebook.</div>' : '')
      + (warnings.length ? '<div class="sx-warn"><b>Loaded with notes:</b><ul>' + warnings.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>' : '');
  }

  function fingerprint(a) { let h = 2166136261; for (let i = 0; i < a.length; i++) { h ^= Math.round(a[i] * 1e6) | 0; h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); }
  function nowBar(failNote) {
    const s = V.s; if (!s) return; const el = $('#sxNow');
    el.className = 'sx-now' + (failNote ? ' fail' : ' flash');
    el.innerHTML = (failNote ? '<b>The last file was not loaded.</b> ' + esc(failNote) + ' Still showing: ' : 'Now showing: ') + '<b>' + esc(s.source.label) + '</b> · loaded ' + (V.loadedAt || '') + ' · ' + s.t.length + ' samples · ' + s.meta.durationS.toFixed(2) + ' s at ' + s.meta.sampleRateHz + ' Hz · ' + s.contractions.length + ' contraction interval(s) · raw RMS ' + f3(SF.windowFeatures(s, 0, s.t.length, V.cfg).rawRms) + '<br>Data fingerprint <b>' + s.fp + '</b>' + (s.source.size ? ' · file size ' + (s.source.size / 1024).toFixed(0) + ' KB · file last modified ' + new Date(s.source.modified).toLocaleString() : '') + (s.meta.seed !== undefined ? ' · seed ' + esc(s.meta.seed) : '') + (s.meta.scenario !== undefined ? ' · scenario ' + esc(s.meta.scenario) : '') + (s.sameAsPrev && !failNote ? '<br><b>This file has exactly the same signal data as the previous one.</b> The charts are identical because the data is identical. ' + (/^random case/.test(s.source.label) ? 'A seed always gives the same case. Clear the seed box for a new random one.' : 'Check the notebook\'s random seed, or that you picked the newly downloaded file.') + '' : '');
    if (failNote) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function setSession(s) {
    V.loadedAt = new Date().toLocaleTimeString(); s.fp = fingerprint(s.raw);
    s.sameAsPrev = V.prevFp === s.fp && V.prevFp != null && !!V.s; V.prevFp = s.fp;
    V.s = s; V.pos = s.t[0]; V.play = false; V.cache = {}; V.hover = null;
    CH.forEach(c => { let lo = Infinity, hi = -Infinity; const d = s[c.key]; for (let i = 0; i < d.length; i++) { if (d[i] < lo) lo = d[i]; if (d[i] > hi) hi = d[i]; } const p = (hi - lo) * .06 || 1; V.ranges[c.key] = [lo - p, hi + p]; });
    $('#sxBody').hidden = false; $('#sxEmpty').hidden = true; $('#sxScrub').min = s.t[0]; $('#sxScrub').max = s.t[s.t.length - 1]; $('#sxScrub').step = 1 / s.meta.sampleRateHz;
    const m = s.meta;
    $('#sxMeta').innerHTML = [['Source', s.source.label], ['Project', m.project], ['Duration', m.durationS.toFixed(2) + ' s'],
      ['Sample rate', m.sampleRateHz + ' Hz' + (m.originalRateHz && m.originalRateHz !== m.sampleRateHz ? ' (original ' + m.originalRateHz + ' Hz)' : '')], ['Samples', s.t.length],
      ['Simulated artifacts', m.artifacts.length ? m.artifacts.map(a => a.replace(/_/g, ' ')).join(', ') : 'not listed']].map(([k, v]) => '<span>' + k + ' <b>' + esc(v) + '</b></span>').join('');
    $('#sxIv').innerHTML = s.contractions.length ? s.contractions.map((c, i) => '<tr><td>' + (i + 1) + '</td><td>' + c.start.toFixed(2) + ' s</td><td>' + c.end.toFixed(2) + ' s</td><td>' + (c.end - c.start).toFixed(2) + ' s</td><td>' + (c.amplitude == null ? 'n/a' : f3(c.amplitude)) + '</td></tr>').join('') : '<tr><td colspan="5">No contraction intervals in this file.</td></tr>';
    recompute(); seek(s.t[0]); if ($('#mode').value === 'replay') { V.play = true; V.last = performance.now(); } nowBar(); console.info('PelviCoach: loaded', s.source.label, s.t.length, 'samples');
  }

  function recompute() {
    if (!V.s) return; V.sum = SF.summarize(V.s, V.cfg); const u = V.sum; V.floor = Float64Array.from(V.s.envelope).sort()[Math.floor(0.05 * V.s.t.length)];
    $('#sxSum').innerHTML = [['Raw RMS', f3(u.rawRms)], ['Processed RMS', f3(u.processedRms)], ['Envelope peak', f3(u.envelopePeak)], ['Envelope median', f3(u.baselineLevel)],
      ['Illustrative level', f3(u.threshold)], ['Windows flagged by quality rules', u.flaggedWindows + ' of ' + u.windows],
      ['Segments above level', u.segments.length ? u.segments.map(g => g.start.toFixed(1) + '–' + g.end.toFixed(1) + ' s').join(', ') : 'none']].map(([k, v]) => '<span>' + k + ' <b>' + v + '</b></span>').join('');
    V.cache = {}; update();
  }

  function seek(t) { const s = V.s; V.pos = Math.max(s.t[0], Math.min(s.t[s.t.length - 1], t)); update(); }

  function update() {
    const s = V.s; if (!s) return; const fb = SF.feedbackAt(s, V.pos, V.cfg, V.sum.refLevel), f = fb.features;
    $('#sxScrub').value = V.pos; $('#sxPlay').textContent = V.play ? 'Pause replay' : (V.pos >= s.t[s.t.length - 1] ? 'Replay again' : 'Play replay');
    $('#sxStatus').textContent = (V.play ? 'Replaying stored file' : 'Replay paused') + ' · ' + V.pos.toFixed(2) + ' s of ' + s.meta.durationS.toFixed(1) + ' s · ' + V.speed + '×';
    const cls = fb.quality === 'ok' ? (fb.level === 'above' ? 'ok' : '') : fb.quality === 'insufficient' ? '' : 'warn';
    $('#sxFb').className = 'sx-fb ' + cls;
    $('#sxFb').innerHTML = '<b>' + esc(fb.levelText) + '</b><br>' + esc(fb.qualityText) + '<div class="kv"><span>Window <b>' + V.cfg.windowMs + ' ms</b></span><span>Envelope mean <b>' + f3(f.envMean) + '</b></span><span>Raw RMS <b>' + f3(f.rawRms) + '</b></span><span>' + V.cfg.mainsHz + ' Hz share <b>' + Math.round(f.mainsFraction * 100) + '%</b></span></div>';
    draw();
  }

  function colX(c, W) { return i => i * W / (V.s.t.length - 1); }
  function path(c, W, H) { // min/max per pixel column, cached per width
    const k = c.key + W + 'x' + H; if (V.cache[k]) return V.cache[k];
    const d = V.s[c.key], n = d.length, [lo, hi] = V.ranges[c.key], Y = v => H - 4 - (v - lo) / (hi - lo) * (H - 8), p = new Path2D();
    for (let x = 0; x < W; x++) { const a = Math.floor(x * n / W), b = Math.max(a + 1, Math.floor((x + 1) * n / W)); let mn = Infinity, mx = -Infinity; for (let i = a; i < b && i < n; i++) { if (d[i] < mn) mn = d[i]; if (d[i] > mx) mx = d[i]; } p.moveTo(x + .5, Y(mn)); p.lineTo(x + .5, Y(mx) + .6); }
    return V.cache[k] = { p, Y };
  }

  const PL = 50, PB = 20, PR = 8;
  function niceStep(T) { const r = T / 8; for (const k of [0.1, 0.2, 0.5, 1, 2, 5, 10, 30, 60]) if (k >= r) return k; return 120; }
  function draw() {
    const s = V.s, n = s.t.length, t0 = s.t[0], T = s.t[n - 1] - t0, step = niceStep(T);
    CH.forEach(c => {
      const cv = $('#sxC_' + c.key), dpr = devicePixelRatio || 1, W = Math.max(260, cv.clientWidth), H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      const pw = W - PL - PR, ph = H - PB, tx = t => PL + (t - t0) / T * pw, { p, Y } = path(c, Math.round(pw), ph), px = tx(V.pos), [lo, hi] = V.ranges[c.key];
      // contraction bands
      x.fillStyle = css('--acc'); x.globalAlpha = .14; s.contractions.forEach(g => x.fillRect(tx(g.start), 0, tx(g.end) - tx(g.start), ph)); x.globalAlpha = 1;
      // grid + axis labels
      x.font = '12px "Atkinson Hyperlegible",system-ui,sans-serif'; x.fillStyle = css('--mut'); x.strokeStyle = css('--line'); x.lineWidth = 1;
      const yt = lo < 0 && hi > 0 ? [hi, 0, lo] : [hi, (hi + lo) / 2, lo]; x.textAlign = 'right'; x.textBaseline = 'middle';
      let lastY = -99; yt.forEach(v => { const y = Y(v); if (Math.abs(y - lastY) < 14) return; lastY = y; x.beginPath(); x.moveTo(PL, y); x.lineTo(PL + pw, y); x.stroke(); x.fillText(v.toFixed(2), PL - 6, Math.min(ph - 6, Math.max(6, y))); });
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      for (let t = 0; t <= T + 1e-9; t += step) { const X = tx(t0 + t); x.beginPath(); x.moveTo(X, 0); x.lineTo(X, ph); x.stroke(); x.fillText(+t.toFixed(2) + ' s', Math.min(W - 14, Math.max(PL + 6, X)), H - 5); }
      // trace: whole file dimmed, replayed part bright
      x.save(); x.translate(PL, 0); x.lineWidth = c.key === 'envelope' ? 2 : 1.2; x.strokeStyle = css(c.col); x.globalAlpha = .8; x.stroke(p); x.globalAlpha = 1;
      x.save(); x.beginPath(); x.rect(0, 0, px - PL, ph); x.clip(); x.lineWidth = c.key === 'envelope' ? 2.5 : 1.5; x.stroke(p); x.restore();
      if (c.key === 'envelope') { x.setLineDash([6, 5]); x.strokeStyle = css('--ink'); x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, Y(V.sum.threshold)); x.lineTo(pw, Y(V.sum.threshold)); x.stroke(); x.setLineDash([]); }
      x.restore();
      x.strokeStyle = css('--warn'); x.lineWidth = 2.5; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, ph); x.stroke();
      if (V.hover != null) { const hx = tx(V.hover); x.strokeStyle = css('--ink'); x.lineWidth = 1; x.beginPath(); x.moveTo(hx, 0); x.lineTo(hx, ph); x.stroke(); }
    });
    const hv = V.hover != null, i = SF.indexAt(s, hv ? V.hover : V.pos);
    $('#sxHover').innerHTML = (hv ? 'Under cursor' : 'At replay position') + ' <b>t = ' + s.t[i].toFixed(3) + ' s</b><span>Raw <b>' + f3(s.raw[i]) + '</b></span><span>Processed <b>' + f3(s.processed[i]) + '</b></span><span>Envelope <b>' + f3(s.envelope[i]) + '</b></span><span>(arbitrary units)</span>';
  }

  function tick(now) {
    if (V.play) { const dt = (now - V.last) / 1000; V.last = now; V.pos += dt * V.speed; const end = V.s.t[V.s.t.length - 1];
      if (V.pos >= end) { if (V.loop) V.pos = V.s.t[0]; else { V.pos = end; V.play = false; } } update(); }
    requestAnimationFrame(tick);
  }

  function timeFromEvent(e, cv) { const r = cv.getBoundingClientRect(), s = V.s; return s.t[0] + Math.max(0, Math.min(1, (e.clientX - r.left - PL) / (r.width - PL - PR))) * (s.t[s.t.length - 1] - s.t[0]); }

  function buildSettings() {
    const D = SF.DEFAULTS, fields = [['windowMs', 'Window (ms)', 50, 2000, 50], ['activityFraction', 'Level as fraction of session 95th-percentile envelope', 0.05, 1, 0.05], ['mainsFractionMax', 'Max mains-frequency power share', 0.05, 1, 0.05],
      ['flatStdMax', 'Min raw std-dev (flat rule)', 0, 0.1, 0.001], ['clipAbs', 'Clip amplitude', 0.5, 20, 0.5], ['clipFractionMax', 'Max clipped share', 0, 0.5, 0.01]];
    $('#sxCfg').innerHTML = fields.map(([k, l, a, b, st]) => '<label for="cfg_' + k + '">' + l + '</label><input id="cfg_' + k + '" type="number" data-k="' + k + '" min="' + a + '" max="' + b + '" step="' + st + '" value="' + D[k] + '">').join('')
      + '<label for="cfg_mainsHz">Mains frequency</label><select id="cfg_mainsHz" data-k="mainsHz"><option>50</option><option>60</option></select>';
    $('#sxCfg').oninput = e => { const k = e.target.dataset.k, v = parseFloat(e.target.value); if (k && isFinite(v) && v >= (e.target.min === '' ? -Infinity : +e.target.min)) { V.cfg[k] = v; recompute(); } };
    $('#sxReset').onclick = () => { V.cfg = Object.assign({}, D); $('#sxCfg').querySelectorAll('[data-k]').forEach(el => el.value = D[el.dataset.k]); recompute(); };
  }

  function init() {
    CH.forEach(c => { const cv = $('#sxC_' + c.key);
      cv.onpointermove = e => { if (!V.s) return; V.hover = timeFromEvent(e, cv); if (e.buttons) seek(V.hover); else draw(); };
      cv.onpointerleave = () => { V.hover = null; if (V.s) draw(); };
      cv.onpointerdown = e => { if (V.s) { cv.setPointerCapture(e.pointerId); seek(timeFromEvent(e, cv)); } }; });
    $('#bLoadSx').onclick = () => $('#sxFile').click();
    $('#sxFile').onchange = async e => { const file = e.target.files[0]; e.target.value = ''; if (!file) return;
      const r = await DataSources.get('colab-json-file').load(file); show(r.errors, r.warnings); if (r.ok) setSession(r.session); else { console.warn('PelviCoach: import failed', r.errors); if (V.s) nowBar(file.name + ': ' + r.errors[0]); else $('#sxMsg').scrollIntoView({ block: 'center' }); } };
    const mode = $('#mode');
    const applyMode = () => { const on = mode.value === 'replay';
      if (on && !V.s) { mode.value = 'sim'; show(['No session is loaded yet. Load or generate one first.'], []); return; }
      ['#sPf', '#f1', '#f2'].forEach(q => $(q).disabled = on); $('#srcNote').hidden = !on; V.loop = on;
      if (on) { if (V.pos >= V.s.t[V.s.t.length - 1]) V.pos = V.s.t[0]; V.play = true; V.last = performance.now(); } if (V.s) update(); };
    mode.addEventListener('change', applyMode);
    $('#sxPlay').onclick = () => { const s = V.s; if (!s) return; if (V.play) { V.play = false; update(); return; }
      if (mode.value !== 'replay') { mode.value = 'replay'; applyMode(); return; }
      if (V.pos >= s.t[s.t.length - 1]) V.pos = s.t[0]; V.play = true; V.last = performance.now(); update(); };
    $('#sxStop').onclick = () => { if (V.s) { V.play = false; seek(V.s.t[0]); } };
    $('#sxSpeed').onchange = e => { V.speed = +e.target.value; update(); };
    $('#sxScrub').oninput = e => seek(+e.target.value);
    $('#bSxDemo').onclick = loadBundled;
    $('#bSxRand').onclick = async () => { const v = $('#sxSeed').value.trim(), r = await DataSources.get('random-synthetic').load({ seed: v === '' ? NaN : parseInt(v, 10) }); show(r.errors, r.warnings); if (r.ok) setSession(r.session); };
    $('#sxDisc').textContent = SF.DISCLAIMER; buildSettings();
    addEventListener('resize', () => { V.cache = {}; if (V.s) draw(); });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => V.s && draw());
    requestAnimationFrame(tick);
  }
  function loadBundled() { if (!window.PELVICOACH_SAMPLE) { show(['The bundled example (js/sample-session.js) was not found.'], []); return; }
    const r = SessionSchema.parseSession(window.PELVICOACH_SAMPLE, 'bundled example (pelvisense_session.json)'); show(r.errors, r.warnings); if (r.ok) setSession(r.session); }
  /* Bridge to the original Patient screen / Signal simulator: values in that app's feature format. */
  window.PelviReplay = { ready: () => !!V.s && !!V.sum, feature(cal) {
    const s = V.s, i = SF.indexAt(s, V.pos), pk = V.sum.envelopePeak, fl = V.floor, fb = SF.feedbackAt(s, V.pos, V.cfg, V.sum.refLevel);
    const nrm = Math.max(0, Math.min(1.3, pk > fl ? (s.envelope[i] - fl) / (pk - fl) : 0)); let pf = cal ? 100 : 4 + 96 * nrm; if (fb.quality === 'flat') pf = 0.4;
    return { pf, pct: Math.round(Math.min(100, cal ? 100 : nrm * 100)), mr: fb.quality === 'line_interference' ? 0.6 : 0.03 }; } };
  window.SessionView = { setSession, init };
  init(); loadBundled();
})();
