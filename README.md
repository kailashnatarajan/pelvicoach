# PelviCoach (web app, no login)

Open the page and start. Two training modes, switchable on the Today screen:
- **Workout**: guided Kegel session with countdown timers.
- **Bedridden**: biofeedback session with the built-in simulator or a live Wokwi ESP32 over MQTT (settings in `config.js`).

Also: pain check before each session, streak and weekly dots, feedback after each session, shareable weekly summary, CSV download, and a **Videos** tab with two videos from this repository.

Sessions are saved in the browser on the device being used (no account, no server). Download the CSV to keep or share them.

## Add your two videos
1. Put your files in the `videos` folder as `video1.mp4` and `video2.mp4` (or change the names and titles in `config.js`).
2. Use .mp4 (H.264). On github.com, files up to 25 MB can be uploaded in the browser (Add file > Upload files).
3. Commit. The Videos tab plays them. If a file is missing, the page tells you the exact file name it expects.

## Put it online with GitHub Pages
1. Create a repository and upload everything in this folder (index.html must be at the top level).
2. Settings > Pages > Deploy from a branch > main > / (root) > Save.
3. After a minute: https://YOUR-NAME.github.io/YOUR-REPO/

## Run on your computer
Open a terminal in this folder and run `python -m http.server 8000`, then open http://localhost:8000 (opening index.html by double-click will not work).

Prototype for a hackathon. Not clinically validated, not medical advice.
