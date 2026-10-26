# PelviCoach: simulated EMG session import (prototype)

Synthetic data only. Not clinically validated. Not a diagnostic tool.

## Run locally
If you only want one file, open `pelvicoach_standalone.html` (everything inlined). The charts show the bundled example on page load; use "Load Simulated EMG Session" for your own file.
No build step, server, API key or install is needed.
1. Keep the folder structure intact (`pelvicoach.html`, `js/`, `sample/`).
2. Double-click `pelvicoach.html` (or open it in Chrome, Edge, Firefox or Safari).
   Optional server: `python3 -m http.server 8000` in this folder, then open http://localhost:8000/pelvicoach.html
3. Scroll to **Simulated EMG session (file import)** and click **Load Simulated EMG Session**.
4. Choose `sample/pelvisense_session.json` (or your own Colab export).
5. Press **Play replay**, drag the slider, or click/drag on any chart to move the replay position.

The page still loads Google Fonts and the MQTT script from CDNs, as before. Offline, it falls back to system fonts; only the existing Wokwi/MQTT mode needs the network. File import works offline.

## Expected JSON
```
{ "mode": "synthetic_emg", "sampling_rate_exported_hz": 1000, "duration_seconds": 10,
  "signals": { "time_s": [...], "raw_emg": [...], "processed_emg": [...], "activity_envelope": [...] },
  "simulation_metadata": { "background_amplitude": 0.04, "contractions": [{"start_s":1.5,"end_s":2.4,"simulated_amplitude":0.38}], "artifacts_added": ["..."] } }
```
Required: `signals` with four equal-length numeric arrays, strictly increasing `time_s`, and `mode` of `synthetic_emg` if present.
Optional (a note is shown if absent): sample rate, duration, `simulation_metadata`.

## Things to try
- Invalid JSON: save a file containing `{x` and load it. Expect a "not valid JSON" message.
- Length mismatch: delete one number from `raw_emg`. Expect the array lengths to be listed.
- Missing field: remove `processed_emg`. Expect it to be named.
- `"mode": "recorded"` is refused (the prototype accepts synthetic sessions only).
- Change rule settings (e.g. mains share limit to 0.1) and watch "windows flagged" change.
- Existing features (simulator, auto demo, clinician log, CSV) are unchanged.

## Files
| File | Role |
|---|---|
| `pelvicoach.html` | Original app plus one new card, a few CSS rules and 4 script tags |
| `js/session-schema.js` | Parse and validate JSON, build the normalized Session (no DOM) |
| `js/signal-feedback.js` | Features and configurable illustrative rules (no DOM) |
| `js/data-sources.js` | Adapter registry; file adapter implemented |
| `js/session-view.js` | Charts, replay, settings UI |

## Adding a Wokwi source later
Implement an adapter (contract in the header of `js/data-sources.js`) that produces the normalized Session
(`t, raw, processed, envelope` arrays plus `meta.sampleRateHz`) and register it with `DataSources.register`.
The charts, replay and feedback code consume only that object and need no changes. Note that the current MQTT
messages (`pf`, `ab`, `mr`) are windowed features, not waveforms, so a compatible adapter would need waveform
samples or a per-window mode in the view.

## Random synthetic cases
`Generate random synthetic case` builds a new case in the browser (optional seed for repeatability). It uses `js/case-generator.js`, an illustrative simulator that is not the Colab notebook's algorithm. Same seed = same case.

## Replay drives the Patient screen
Press `Play replay` (or choose `Imported session replay` under Signal source). The replay loops and feeds the Patient screen and Signal simulator: squeeze % comes from the file's envelope (0% = quiet level, 100% = file peak), and signal-quality flags (mains/flat) come from the illustrative rules. The file has no abdominal channel, so abdominal activity stays on its slider. Calibration in this mode sets 100% to the file's peak.
