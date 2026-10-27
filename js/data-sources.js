/* data-sources.js
 * Input adapters. The UI never reads files, MQTT, or Wokwi directly; it only receives a
 * normalized Session (see session-schema.js) through SessionView.setSession().
 *
 * ADAPTER CONTRACT
 *   { id, label, kind: 'file' | 'stream' }
 *   file adapters:   load(input) -> Promise<{ok, session, errors, warnings}>
 *   stream adapters: start(sink), stop(); call sink.setSession(session) once, then
 *                    sink.append({t, raw, processed, envelope}) for each chunk.
 * A future Wokwi adapter maps its messages to these arrays and registers itself with
 * DataSources.register(...). It needs no change to the UI or to signal-feedback.js.
 * (Only the file adapter is implemented now. Nothing here opens a network connection.)
 */
(function (root) {
  const registry = {};
  const register = a => { registry[a.id] = a; return a; };

  register({
    id: 'colab-json-file', label: 'Colab JSON export (local file)', kind: 'file',
    load(file) {
      if (!file) return Promise.resolve({ ok: false, errors: ['No file selected.'], warnings: [] });
      if (file.size > SessionSchema.LIMITS.maxBytes)
        return Promise.resolve({ ok: false, errors: ['File is larger than ' + SessionSchema.LIMITS.maxBytes / 1e6 + ' MB.'], warnings: [] });
      return new Promise(resolve => {
        const r = new FileReader();
        r.onerror = () => resolve({ ok: false, errors: ['The browser could not read this file.'], warnings: [] });
        r.onload = () => { const res = SessionSchema.parseSession(String(r.result), file.name); if (res.ok) Object.assign(res.session.source, { size: file.size, modified: file.lastModified }); resolve(res); };
        r.readAsText(file);
      });
    }
  });
  root.DataSources = { register, get: id => registry[id], list: () => Object.values(registry) };
})(window);
