/* backend-hooks.js: plugs cloud sync + authenticated MQTT into the existing patient app without
 * rewriting it. Loaded after the main inline script. Wraps startSes/endRep, replaces the MQTT button. */
(function () {
  const C = window.PC_CONFIG || {}, $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DEV = C.DEVICE_ID || 'pfm13-01';

  // ---------- MQTT (authenticated, per-device topics, offline detection)
  const bMq = $('#bMq'); let mqc = null;
  bMq.onclick = () => {
    if (!C.MQTT_URL || typeof mqtt === 'undefined') { bMq.textContent = 'Set MQTT in js/config.js'; return; }
    if (mqc) mqc.end(true);
    const base = 'pelvicoach/' + DEV + '/';
    mqc = mqtt.connect(C.MQTT_URL, { username: C.MQTT_USER, password: C.MQTT_PASS, clientId: 'web-' + Math.random().toString(16).slice(2, 10), reconnectPeriod: 3000 });
    mqc.on('connect', () => { mqc.subscribe([base + 'window', base + 'status']); bMq.textContent = 'Connected'; });
    mqc.on('error', () => { bMq.textContent = 'MQTT error, retrying'; });
    mqc.on('message', (t, p) => {
      const s = p.toString();
      if (t.endsWith('/status')) { if (s !== 'online') S.live = null; return; }
      try { const d = JSON.parse(s); d._t = performance.now(); S.live = d; } catch (e) {}
    });
  };
  setInterval(() => { if (mqc && mqc.connected && $('#mode').value === 'live') { const L = S.live; bMq.textContent = L && performance.now() - L._t < 1500 ? 'Live ●' : 'Device offline'; } }, 500);

  // ---------- Account card
  const sec = document.createElement('section'); sec.className = 'card wide'; sec.setAttribute('aria-label', 'Account and cloud sync');
  sec.innerHTML = '<h2>Account and cloud sync</h2><p id="acNote" style="margin:0 0 8px;color:var(--mut)"></p>' +
    '<div id="acForm"><label for="acName">Name (sign-up only)</label><input id="acName" autocomplete="name">' +
    '<label for="acMail">Email</label><input id="acMail" type="email" autocomplete="email"><label for="acPw">Password (6+ characters)</label><input id="acPw" type="password" autocomplete="current-password">' +
    '<div class="row"><button id="acIn" class="p">Sign in</button><button id="acUp">Create patient account</button></div></div>' +
    '<div id="acOn" hidden><p id="acWho"></p><div class="row"><button id="acOut">Sign out</button></div></div><small>Only attempt results (not signals) are uploaded. Synthetic demo data only.</small>';
  $('main').appendChild(sec);
  for (const i of sec.querySelectorAll('input')) Object.assign(i.style, { width: '100%', font: 'inherit', padding: '8px', borderRadius: '8px', border: '2px solid var(--line)', background: 'var(--card)', color: 'var(--ink)' });
  const note = t => { $('#acNote').textContent = t; };

  let me = null, cfg = null, sidP = null;
  async function refresh() {
    if (!Backend.enabled) { note('Cloud sync is off (add keys in js/config.js). The app works fully offline.'); $('#acForm').hidden = true; return; }
    try { me = await Backend.me(); } catch (e) { me = null; }
    $('#acForm').hidden = !!me; $('#acOn').hidden = !me;
    if (!me) { cfg = null; note('Sign in to save attempts for your clinician.'); return; }
    $('#acWho').innerHTML = 'Signed in as <b>' + esc(me.full_name || 'patient') + '</b> (' + esc(me.role) + '). Your clinician link code: <b>' + esc(me.link_code) + '</b>';
    try { cfg = await Backend.mySettings(); } catch (e) {} note(cfg ? 'Clinician settings loaded: target ' + cfg.target_pct + '%, hold ' + cfg.hold_s + ' s.' : 'Cloud sync on.');
  }
  const act = fn => async () => { try { note('Working…'); await fn(); await refresh(); } catch (e) { note(e.message); } };
  $('#acIn').onclick = act(async () => { const r = await Backend.signIn($('#acMail').value, $('#acPw').value); if (r.error) throw r.error; });
  $('#acUp').onclick = act(async () => { const r = await Backend.signUp($('#acMail').value, $('#acPw').value, $('#acName').value); if (r.error) throw r.error; if (!r.data.session) throw new Error('Check your email to confirm, then sign in.'); });
  $('#acOut').onclick = act(async () => { await Backend.signOut(); sidP = null; });
  refresh(); setInterval(() => { if (me) Backend.mySettings().then(s => { cfg = s; }).catch(() => {}); }, 30000);

  // ---------- Hook the training loop
  const src = () => ({ sim: 'simulator', live: 'wokwi', replay: 'replay' })[$('#mode').value];
  const _start = startSes, _end = endRep;
  startSes = function (now) { _start(now); sidP = null; if (cfg) { S.target = cfg.target_pct; S.hold = cfg.hold_s; S.goal = cfg.goal_reps; } };
  endRep = function (now) {
    const n = S.log.length; _end(now);
    if (S.log.length > n && me) {
      const row = S.log[S.log.length - 1];
      sidP = sidP || Backend.startSession(src(), Math.round(S.mvc), DEV);
      sidP.then(id => Backend.logAttempt(id, row)).then(() => note('Synced attempt ' + row.n), e => note('Sync failed, will retry: ' + e.message));
    }
    if (S.phase === 'idle' && S.done >= S.goal && sidP) { const p = sidP; sidP = null; p.then(id => Backend.endSession(id)).catch(() => {}); }
  };
})();
