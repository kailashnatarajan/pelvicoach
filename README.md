# PelviCoach (merged app, Supabase)

Two patient modes, chosen by the patient (a doctor is optional and can override): **workout** (guided timers) and **bedridden** (your adaptive biofeedback, simulator or live Wokwi ESP32 over MQTT). Doctors see all linked patients' sessions and feedback, switch modes, and edit or pause plans. Data is stored in Supabase, not on the device.

## Setup (about 10 minutes, no card needed)
1. supabase.com > New project (pick a region near you, save the database password).
2. Authentication > Sign In / Providers > Email: turn **Confirm email OFF** (easiest for a demo; otherwise users must click an email link first).
3. SQL Editor > New query: paste all of `supabase.sql`, **change CHANGE-ME-CLINIC-CODE to your own secret code**, and Run.
4. Project Settings > API: copy the Project URL and the anon public key into `config.js`.
5. Run locally (modules need http, not file://): `python3 -m http.server 8000`, then open http://localhost:8000
6. Deploy: drag the folder onto Netlify (or use Vercel / GitHub Pages). Then in Supabase: Authentication > URL Configuration, set Site URL to your deployed address.

## Try it
0. Patients can sign up with no doctor and pick Workout or Bedridden themselves, then link a doctor later from the Today screen.
1. Sign up as a doctor with your clinic code. Note the invite code on the dashboard.
2. In a private window, sign up as a patient with that invite code.
3. Do a session as the patient, then watch it appear on the doctor's dashboard (refreshes every 15 seconds).
4. As the doctor, switch the patient to Bedridden and try Simulator, then Live sensor.

Prototype for a hackathon. Not clinically validated, not medical advice.

Note: database objects are prefixed `pc_` (pc_profiles, pc_sessions, pc_clinic_config) so they never clash with existing tables.

## Putting it on GitHub and hosting it
1. Create a new repository on github.com and upload everything in this folder (index.html must be at the top level of the repo).
2. Repository Settings > Pages > Build and deployment: Deploy from a branch > main > / (root) > Save.
3. After a minute your app is live at https://YOUR-NAME.github.io/YOUR-REPO/
4. The Supabase URL and anon key in config.js are meant to be public (privacy is enforced by the database rules). Never commit a service_role or secret key.
5. Already have a database? Run supabase_update.sql, not supabase.sql (which resets all data).
