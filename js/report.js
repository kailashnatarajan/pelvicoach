/* report.js: numbers behind "My report" (patient) and "Doctor report" (clinician).
 * For now it reads sessions saved on this device. When the database is added, only sessions(), plan() and setPlan() change. */
(function (root) {
  const KEY = 'pelvicoach_v1', PK = 'pelvicoach_plan', DEF = { target: 30, hold: 3, goal: 8 };
  const FEEL = { 1: 'Hard', 2: 'Okay', 3: 'Good' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v) || a));
  const when = ts => new Date(ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const sessions = () => { try { return JSON.parse(localStorage.getItem(KEY)).sessions || []; } catch (e) { return []; } };
  const plan = () => { try { return { ...DEF, ...JSON.parse(localStorage.getItem(PK)) }; } catch (e) { return { ...DEF }; } };
  const setPlan = p => localStorage.setItem(PK, JSON.stringify({ target: clamp(p.target, 10, 90), hold: clamp(p.hold, 1, 12), goal: clamp(p.goal, 1, 30) }));

  function stats(a) {
    const c = { OK: 0, MISS: 0, COMPENSATED: 0, INVALID: 0 }, per = []; let fc = 0;
    a.slice().reverse().forEach(s => {
      if (!s.reps) return;
      const k = { OK: 0, MISS: 0, COMPENSATED: 0, INVALID: 0 };
      s.reps.forEach(r => { k[r.r]++; c[r.r]++; });
      fc += s.falseAvoided || 0;
      const v = k.OK + k.MISS + k.COMPENSATED;
      per.push({ ts: s.ts, rate: v ? Math.round(100 * k.OK / v) : 0, target: s.endTarget || (s.reps.length ? s.reps[s.reps.length - 1].t : 0) });
    });
    const v = c.OK + c.MISS + c.COMPENSATED;
    const days7 = new Set(a.filter(s => s.fin > 0 && (Date.now() - s.ts) < 7 * 864e5).map(s => s.date)).size;
    return { c, fc, per, rate: v ? Math.round(100 * c.OK / v) : null, n: a.length, pain: a.filter(s => s.pain).length, days7 };
  }
  const bars = (per, key) => per.length ? `<div class="bars" role="img" aria-label="${key} per session">${per.slice(-12).map(p => `<i style="height:${Math.max(4, p[key])}%" title="${when(p.ts)}: ${p[key]}%"></i>`).join('')}</div>` : '<p class="mute">No sensor sessions yet.</p>';
  const line = s => `${s.skip ? 'Skipped (discomfort)' : s.fin + ' of ' + s.total + (s.mode === 'bedridden' ? ' good squeezes' : ' exercises')} · ${Math.round(s.secs / 60)} min`;

  /* Patient-facing report, plain language */
  function clientHtml(a) {
    const st = stats(a), L = { OK: 'Good squeezes', MISS: 'Needed more squeeze', COMPENSATED: 'Tummy helped too', INVALID: 'Sensor problem (not counted)' };
    return `<h1>My report</h1>
<div class="card"><h2>This week</h2><div class="sum"><div class="stat"><b>${st.days7} of 7</b>days practised</div><div class="stat"><b>${st.rate == null ? '–' : st.rate + '%'}</b>good squeezes</div></div>
${st.fc ? `<p style="margin-top:10px">The sensor stopped ${st.fc} squeeze${st.fc > 1 ? 's' : ''} that looked strong but were not done correctly.</p>` : ''}</div>
<div class="card"><h2>How your squeezes went</h2><ul class="list">${Object.keys(L).map(k => `<li><span>${L[k]}</span><b>${st.c[k]}</b></li>`).join('')}</ul>${bars(st.per, 'rate')}<p class="mute">Each bar is one session. Taller is better.</p></div>
<div class="card"><h2>Past sessions</h2><div class="row"><button class="btn ghost" onclick="x.shareWeek()">Share weekly summary</button><button class="btn ghost" onclick="x.export()">Download CSV</button></div>
${a.length ? `<ul class="list">${a.map(s => `<li><span>${when(s.ts)}<br><span class="mute">${line(s)}${s.note && !s.skip ? ' · “' + esc(s.note) + '”' : ''}</span></span><b>${FEEL[s.feel] || ''}${s.pain ? ' ⚑' : ''}</b></li>`).join('')}</ul>` : '<p class="mute">No sessions yet.</p>'}
<button class="lnk" onclick="x.clear()">Delete all my sessions</button></div>`;
  }
  root.Rpt = { sessions, plan, setPlan, stats, bars, line, clientHtml, esc, when, FEEL };
})(window);
