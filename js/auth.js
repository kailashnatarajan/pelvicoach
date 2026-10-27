/* auth.js: sign-in / sign-up for patients and clinicians, plus a guard other pages call.
 * Roles live in the database (profiles.role). The browser never decides a role; it only asks the database.
 * Needs: config.js, supabase-js, backend.js loaded first. */
(function (root) {
  const HOME = { patient: 'patient.html', clinician: 'clinician.html' };
  const $ = s => document.querySelector(s);

  const friendly = m => {
    m = String(m || '');
    if (/invalid login/i.test(m)) return 'Email or password is not correct.';
    if (/already registered/i.test(m)) return 'This email already has an account. Use Sign in instead.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first (check your inbox), then sign in.';
    if (/password/i.test(m) && /6/.test(m)) return 'Password must be at least 6 characters.';
    if (/rate limit/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
    return m || 'Something went wrong. Try again.';
  };

  const Auth = {
    HOME,
    friendly,

    /* Call at the top of a protected page. Resolves to the user's profile.
     * Wrong role -> sent to their own dashboard. Not signed in -> sent to login.
     * If Supabase keys are not filled in yet, resolves to null so the offline demo still works. */
    async guard(role) {
      if (!Backend.enabled) return null;
      let me = null;
      try { me = await Backend.me(); } catch (e) { me = null; }
      if (!me) { location.replace('login.html?role=' + role); return new Promise(() => {}); }
      if (me.role !== role) { location.replace(HOME[me.role] || 'login.html'); return new Promise(() => {}); }
      return me;
    },

    async signOut() { try { await Backend.signOut(); } catch (e) {} location.href = 'index.html'; },

    initLoginPage() {
      let role = new URLSearchParams(location.search).get('role') === 'clinician' ? 'clinician' : 'patient';
      let mode = 'in';   // 'in' = sign in, 'up' = create account
      const msg = (t, kind) => { const m = $('#msg'); m.textContent = t || ''; m.className = 'note' + (kind ? ' ' + kind : ''); m.hidden = !t; };

      function paint() {
        document.body.dataset.role = role;
        const R = role === 'clinician' ? 'Clinician' : 'Patient';
        $('#tabPatient').setAttribute('aria-pressed', role === 'patient');
        $('#tabClinician').setAttribute('aria-pressed', role === 'clinician');
        $('#title').textContent = R + (mode === 'in' ? ' sign in' : ' sign up');
        $('#sub').textContent = role === 'clinician'
          ? (mode === 'in' ? 'Sign in to review your patients and set their training targets.' : 'Create a clinician account with your access code.')
          : (mode === 'in' ? 'Sign in to see your exercises and progress.' : 'Create an account to start training.');
        $('#nameRow').hidden = mode === 'in';
        $('#pwHint').hidden = mode === 'in';
        $('#codeRow').hidden = role !== 'clinician';
        $('#codeRow .hint').textContent = mode === 'in' ? 'Only needed the first time you sign in as a clinician.' : 'Given to you by the project team. It stops patients from creating clinician accounts.';
        $('#pw').autocomplete = mode === 'in' ? 'current-password' : 'new-password';
        $('#go').textContent = mode === 'in' ? 'Sign in' : 'Create ' + R.toLowerCase() + ' account';
        $('#swapText').textContent = mode === 'in' ? 'New here?' : 'Already have an account?';
        $('#swap').textContent = mode === 'in' ? 'Create an account' : 'Sign in';
        msg('');
      }
      $('#tabPatient').onclick = () => { role = 'patient'; paint(); };
      $('#tabClinician').onclick = () => { role = 'clinician'; paint(); };
      $('#swap').onclick = () => { mode = mode === 'in' ? 'up' : 'in'; paint(); };
      paint();

      if (!Backend.enabled) {
        $('#go').disabled = true;
        msg('Sign-in is not connected yet. Open js/config.js and paste your Supabase URL and anon key (see README, step 3).', 'err');
        return;
      }
      // Already signed in? Go straight to the right dashboard.
      Backend.me().then(me => { if (me) location.replace(HOME[me.role]); }).catch(() => {});

      $('#form').onsubmit = async ev => {
        ev.preventDefault();
        const email = $('#email').value.trim(), pw = $('#pw').value, name = $('#name').value.trim(), code = $('#code').value.trim();
        if (!email || !pw) return msg('Enter your email and password.', 'err');
        if (mode === 'up' && pw.length < 6) return msg('Password must be at least 6 characters.', 'err');
        if (mode === 'up' && role === 'clinician' && !code) return msg('Enter the clinician access code.', 'err');
        $('#go').disabled = true; msg('Working…');
        try {
          if (mode === 'up') {
            const r = await Backend.signUp(email, pw, name);
            if (r.error) throw r.error;
            if (!r.data.session) { mode = 'in'; paint(); msg('Account created. Check your email to confirm it, then sign in' + (role === 'clinician' ? ' and enter the same access code.' : '.'), 'okk'); return; }
            if (role === 'clinician') {
              try { await Backend.claimClinician(code); }
              catch (e) { await Backend.signOut(); mode = 'in'; paint(); msg('Wrong clinician access code. Your account was created as a patient account. Sign in on the Patient tab, or ask for the right code.', 'err'); return; }
            }
          } else {
            const r = await Backend.signIn(email, pw);
            if (r.error) throw r.error;
          }
          let me = await Backend.me();
          if (me && me.role === 'patient' && role === 'clinician' && code) {
            try { await Backend.claimClinician(code); me = await Backend.me(); }
            catch (e) { await Backend.signOut(); msg('Wrong clinician access code.', 'err'); return; }
          }
          if (!me) throw new Error('Could not load your profile. Try again.');
          if (me.role !== role) {
            await Backend.signOut();
            role = me.role; mode = 'in'; paint();
            msg('That email is a ' + me.role + ' account, so we switched to the ' + me.role + ' login. Sign in again.', 'err');
            return;
          }
          location.replace(HOME[role]);
        } catch (e) { msg(friendly(e.message), 'err'); }
        finally { $('#go').disabled = false; }
      };
    }
  };
  root.Auth = Auth;
})(window);
