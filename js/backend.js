/* backend.js: thin Supabase wrapper shared by the patient app and the clinician dashboard.
 * If config is empty, Backend.enabled is false and the app keeps working offline. */
(function (root) {
  const C = root.PC_CONFIG || {};
  const enabled = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && root.supabase);
  const sb = enabled ? root.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  const queue = [];                                   // attempts that failed to upload (retried later)
  const uid = async () => (await sb.auth.getUser()).data.user?.id;
  const ck = r => { if (r.error) throw new Error(r.error.message); return r.data; };

  const B = {
    enabled, client: sb,
    signUp: (email, password, name) => sb.auth.signUp({ email, password, options: { data: { full_name: name || '' } } }),
    signIn: (email, password) => sb.auth.signInWithPassword({ email, password }),
    signOut: () => sb.auth.signOut(),
    claimClinician: async code => ck(await sb.rpc('claim_clinician', { p_code: code })),
    async me() { const id = enabled && await uid(); return id ? ck(await sb.from('profiles').select('*').eq('id', id).single()) : null; },

    // ---- patient side
    async startSession(source, mvc, device) {
      return ck(await sb.from('sessions').insert({ patient_id: await uid(), source, mvc, device_id: device }).select('id').single()).id;
    },
    async logAttempt(sessionId, r) {
      queue.push({ session_id: sessionId, n: r.n, result: r.res, target_pct: r.tgt, hold_s: r.hold, avg_squeeze_pct: r.avg,
        why: r.why, amplitude_only_verdict: r.nv, false_credit: !!r.fc });
      const rows = queue.splice(0);
      const { error } = await sb.from('attempts').insert(rows);
      if (error) { queue.unshift(...rows); throw new Error(error.message); }
    },
    endSession: async id => ck(await sb.from('sessions').update({ ended_at: new Date().toISOString() }).eq('id', id)),
    async mySettings() { return ck(await sb.from('settings').select('*').eq('patient_id', await uid()).maybeSingle()); },

    // ---- clinician side
    async linkByCode(code) { return ck(await sb.rpc('link_by_code', { p_code: code })); },
    async patients() { return ck(await sb.from('profiles').select('id,full_name').eq('role', 'patient').order('full_name')); },
    async recent(pid, n = 80) {
      return ck(await sb.from('attempts').select('*, sessions!inner(patient_id,started_at,source)')
        .eq('sessions.patient_id', pid).order('created_at', { ascending: false }).limit(n));
    },
    async settingsOf(pid) { return ck(await sb.from('settings').select('*').eq('patient_id', pid).maybeSingle()); },
    async saveSettings(pid, s) {
      return ck(await sb.from('settings').upsert({ patient_id: pid, target_pct: s.target_pct, hold_s: s.hold_s, goal_reps: s.goal_reps,
        updated_by: await uid(), updated_at: new Date().toISOString() }));
    },
    subscribeLive(cb) {
      return sb.channel('pc-live-' + Math.random().toString(36).slice(2))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, cb).subscribe();
    }
  };
  root.Backend = B;
})(window);
