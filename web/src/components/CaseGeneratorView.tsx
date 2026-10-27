import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileUp,
  Info,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  generateScenarioCase,
  SCENARIOS,
  ScenarioDefinition,
} from '../services/caseGenerator';
import { NormalizedSession, parseSession } from '../services/sessionSchema';
import * as SF from '../services/signalFeedback';

export interface CaseGeneratorViewProps {
  initialScenarioKey?: string;
  onSelectForReplay?: (session: NormalizedSession) => void;
}

export const CaseGeneratorView: React.FC<CaseGeneratorViewProps> = ({
  initialScenarioKey = 'typical',
  onSelectForReplay,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(initialScenarioKey);
  const [seedInput, setSeedInput] = useState<string>('42');
  const [session, setSession] = useState<NormalizedSession | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SF.SessionSummary | null>(null);
  const [replayPos, setReplayPos] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [rulesConfig, setRulesConfig] = useState<SF.FeedbackConfig>({ ...SF.DEFAULTS });
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [notesMsg, setNotesMsg] = useState<string>('');

  const rawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const procCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const envCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Generate initial or new case
  const handleGenerate = (key = selectedKey, seedStr = seedInput) => {
    setErrorMsg('');
    setNotesMsg('');
    let seed = seedStr.trim() === '' ? Math.floor(Math.random() * 4294967296) : parseInt(seedStr, 10);
    if (isNaN(seed)) seed = 42;

    let targetKey = key;
    if (key === 'random') {
      targetKey = SCENARIOS[seed % SCENARIOS.length].key;
    }

    const res = generateScenarioCase(targetKey, seed);
    if (res.ok && res.session) {
      setSession(res.session);
      const sum = SF.summarize(res.session, rulesConfig);
      setSessionSummary(sum);
      setReplayPos(res.session.t[0]);
      setIsPlaying(false);
      if (onSelectForReplay) onSelectForReplay(res.session);
    } else {
      setErrorMsg(res.errors.join(' '));
    }
  };

  useEffect(() => {
    handleGenerate(initialScenarioKey, '42');
  }, [initialScenarioKey]);

  // Load bundled example from /pelvisense_session.json or window.PELVICOACH_SAMPLE
  const handleLoadBundled = async () => {
    try {
      if ((window as any).PELVICOACH_SAMPLE) {
        const res = parseSession((window as any).PELVICOACH_SAMPLE, 'bundled example (sample-session.js)');
        if (res.ok && res.session) {
          setSession(res.session);
          setSessionSummary(SF.summarize(res.session, rulesConfig));
          setReplayPos(res.session.t[0]);
          setIsPlaying(false);
          setNotesMsg('Loaded bundled synthetic session (pelvisense_session.json).');
          return;
        }
      }

      // Fetch from public
      const resp = await fetch('./pelvisense_session.json');
      if (resp.ok) {
        const json = await resp.json();
        const res = parseSession(json, 'bundled example (pelvisense_session.json)');
        if (res.ok && res.session) {
          setSession(res.session);
          setSessionSummary(SF.summarize(res.session, rulesConfig));
          setReplayPos(res.session.t[0]);
          setIsPlaying(false);
          setNotesMsg('Loaded bundled synthetic session (pelvisense_session.json).');
        } else {
          setErrorMsg(res.errors.join(' '));
        }
      }
    } catch (e: any) {
      setErrorMsg('Failed to load bundled sample: ' + e?.message);
    }
  };

  // Import local JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = parseSession(String(reader.result), file.name);
      if (res.ok && res.session) {
        setSession(res.session);
        setSessionSummary(SF.summarize(res.session, rulesConfig));
        setReplayPos(res.session.t[0]);
        setIsPlaying(false);
        setNotesMsg(`Loaded file: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
      } else {
        setErrorMsg(res.errors.join(' '));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Replay animation loop
  useEffect(() => {
    const loop = (now: number) => {
      if (isPlaying && session) {
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;
        setReplayPos((prev) => {
          const next = prev + dt * playSpeed;
          const end = session.t[session.t.length - 1];
          if (next >= end) {
            setIsPlaying(false);
            return end;
          }
          return next;
        });
      } else {
        lastTimeRef.current = now;
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, session, playSpeed]);

  // Redraw 3 synchronized canvas charts
  useEffect(() => {
    if (!session || !sessionSummary) return;

    const PL = 50,
      PB = 22,
      PR = 10;
    const s = session;
    const n = s.t.length;
    const t0 = s.t[0];
    const T = s.t[n - 1] - t0;
    const curPos = replayPos;
    const hover = hoverTime;

    const channels: Array<{
      canvas: HTMLCanvasElement | null;
      data: Float64Array;
      color: string;
      isEnvelope?: boolean;
    }> = [
      { canvas: rawCanvasRef.current, data: s.raw, color: '#8E3FB0' },
      { canvas: procCanvasRef.current, data: s.processed, color: '#0284C7' },
      { canvas: envCanvasRef.current, data: s.envelope, color: '#0D9488', isEnvelope: true },
    ];

    channels.forEach(({ canvas, data, color, isEnvelope }) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth || 640;
      const H = canvas.clientHeight || 150;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Determine y range
      let lo = Infinity,
        hi = -Infinity;
      for (let i = 0; i < data.length; i++) {
        if (data[i] < lo) lo = data[i];
        if (data[i] > hi) hi = data[i];
      }
      const pad = (hi - lo) * 0.08 || 0.1;
      lo -= pad;
      hi += pad;

      const pw = W - PL - PR;
      const ph = H - PB;
      const tx = (t: number) => PL + ((t - t0) / T) * pw;
      const Y = (v: number) => ph - ((v - lo) / (hi - lo)) * (ph - 12);

      // Shaded bands for simulated contraction intervals
      ctx.fillStyle = '#0D9488';
      ctx.globalAlpha = 0.12;
      s.contractions.forEach((c) => {
        const x1 = tx(c.start);
        const x2 = tx(c.end);
        ctx.fillRect(x1, 0, Math.max(2, x2 - x1), ph);
      });
      ctx.globalAlpha = 1.0;

      // Grid lines & axis labels
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;

      // Horizontal grid
      const yTicks = [hi, (hi + lo) / 2, lo];
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      yTicks.forEach((v) => {
        const y = Y(v);
        ctx.beginPath();
        ctx.moveTo(PL, y);
        ctx.lineTo(PL + pw, y);
        ctx.stroke();
        ctx.fillText(v.toFixed(2), PL - 6, Math.min(ph - 4, Math.max(8, y)));
      });

      // Time axis grid
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const step = T <= 10 ? 1 : 2;
      for (let t = 0; t <= T + 0.01; t += step) {
        const x = tx(t0 + t);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ph);
        ctx.stroke();
        ctx.fillText(t.toFixed(0) + 's', x, H - 4);
      }

      // Draw full signal trace (dimmed)
      ctx.save();
      ctx.translate(PL, 0);
      ctx.lineWidth = isEnvelope ? 2.0 : 1.2;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      const stepSample = Math.max(1, Math.floor(data.length / pw));
      for (let i = 0; i < data.length; i += stepSample) {
        const x = (i / (data.length - 1)) * pw;
        const y = Y(data[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Draw replayed portion (bright)
      const px = tx(curPos);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, px - PL, ph);
      ctx.clip();
      ctx.lineWidth = isEnvelope ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();

      // If envelope, draw illustrative threshold line
      if (isEnvelope && sessionSummary) {
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, Y(sessionSummary.threshold));
        ctx.lineTo(pw, Y(sessionSummary.threshold));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // Draw vertical replay cursor
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, ph);
      ctx.stroke();

      // Draw vertical hover cursor
      if (hover != null) {
        const hx = tx(hover);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx, ph);
        ctx.stroke();
      }
    });
  }, [session, sessionSummary, replayPos, hoverTime]);

  const handlePointerTime = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!session) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const PL = 50,
      PR = 10;
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left - PL) / (rect.width - PL - PR)));
    const t = session.t[0] + frac * (session.t[session.t.length - 1] - session.t[0]);
    if (e.buttons) {
      setReplayPos(t);
    } else {
      setHoverTime(t);
    }
  };

  const activeTime = hoverTime ?? replayPos;
  const activeIdx = session ? SF.indexAt(session, activeTime) : 0;
  const activeFb =
    session && sessionSummary ? SF.feedbackAt(session, activeTime, rulesConfig, sessionSummary.refLevel) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Generator Controls Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span
              style={{
                background: '#FEF3C7',
                color: '#B45309',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '8px',
                textTransform: 'uppercase',
              }}
            >
              Synthetic Case Engine
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
              Scenario Case Generator
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              Select from 7 clinical scenarios or import Colab synthetic sessions for synchronized 3-channel waveform analysis.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {notesMsg && (
          <div
            style={{
              background: '#F0FDFA',
              color: '#0F766E',
              border: '1px solid #99F6E4',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            {notesMsg}
          </div>
        )}

        {/* Generator Form */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              Scenario Selection
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
                fontWeight: 700,
                background: '#FFFFFF',
              }}
            >
              <option value="random">🎲 Random Scenario (Chosen by Seed)</option>
              {SCENARIOS.map((sc) => (
                <option key={sc.key} value={sc.key}>
                  {sc.id} · {sc.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '130px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              Seed (Reproducible)
            </label>
            <input
              type="number"
              value={seedInput}
              placeholder="e.g. 42"
              onChange={(e) => setSeedInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
                fontWeight: 700,
              }}
            />
          </div>

          <button
            onClick={() => handleGenerate()}
            style={{
              padding: '11px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#0D9488',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={16} />
            Generate Case
          </button>

          <button
            onClick={handleLoadBundled}
            style={{
              padding: '11px 16px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileCode size={16} />
            Load Bundled Example
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '11px 16px',
              borderRadius: '10px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileUp size={16} />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Clinical Context & Derived Interpretation (if generated from scenario) */}
      {session?.clin && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span
                style={{
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '8px',
                }}
              >
                Fictional Patient {session.clin.prof.id} · Session {session.clin.prof.session}
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
                {session.clin.sc.name}
              </h3>
            </div>
            <span
              style={{
                background: session.clin.m.quality === 'Good' ? '#DCFCE7' : '#FEF3C7',
                color: session.clin.m.quality === 'Good' ? '#15803D' : '#B45309',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 800,
              }}
            >
              Signal: {session.clin.m.quality}
            </span>
          </div>

          {/* Metric Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '18px' }}>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Peak Above Baseline</span>
              <b style={{ fontSize: '18px', color: '#0F172A' }}>{session.clin.m.peak?.toFixed(2) ?? 'n/a'} a.u.</b>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Time to Activation</span>
              <b style={{ fontSize: '18px', color: '#0F172A' }}>{session.clin.m.lat?.toFixed(2) ?? 'n/a'} s</b>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Return to Baseline</span>
              <b style={{ fontSize: '18px', color: '#0F172A' }}>
                {session.clin.m.relaxed ? `${session.clin.m.relax?.toFixed(2)} s` : 'Not Reached'}
              </b>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Met Cue Promptly (&le;0.8s)</span>
              <b style={{ fontSize: '18px', color: '#0F172A' }}>
                {session.clin.m.met} of {session.clin.m.n}
              </b>
            </div>
          </div>

          {/* Clinical Interpretation Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                Clinical Context & History
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><b>Age:</b> {session.clin.prof.age} years</li>
                <li><b>Complaint:</b> {session.clin.prof.complaint} ({session.clin.prof.duration})</li>
                <li><b>History:</b> {session.clin.prof.history}</li>
                <li><b>Mobility:</b> {session.clin.prof.mobility}</li>
                <li><b>Oxford Scale:</b> {session.clin.prof.oxford ?? 'Not assessed'}/5</li>
                <li><b>Resting Tone:</b> {session.clin.prof.tone ?? 'Not assessed'}</li>
              </ul>
            </div>

            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                Algorithmic Interpretation
              </h4>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {session.clin.sc.read(session.clin.m)}
              </p>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
                <b>Differential Factors:</b> {session.clin.sc.alt.join('; ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Synchronized 3-Channel Signal Waveforms & Replay */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>3-Channel Waveform Replay</h3>
            <p style={{ fontSize: '13px', color: '#64748B' }}>
              Synchronized time axis across Raw Contaminated EMG, Processed EMG, and Extracted Activity Envelope
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Settings2 size={15} />
            Rule Settings {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Rule Config Drawer */}
        {showConfig && (
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
              Illustrative Signal Quality Rule Settings
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#64748B' }}>Window (ms)</label>
                <input
                  type="number"
                  value={rulesConfig.windowMs}
                  step="50"
                  onChange={(e) => setRulesConfig({ ...rulesConfig, windowMs: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748B' }}>Activity Fraction</label>
                <input
                  type="number"
                  step="0.05"
                  value={rulesConfig.activityFraction}
                  onChange={(e) => setRulesConfig({ ...rulesConfig, activityFraction: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748B' }}>Max Mains 50Hz Ratio</label>
                <input
                  type="number"
                  step="0.05"
                  value={rulesConfig.mainsFractionMax}
                  onChange={(e) => setRulesConfig({ ...rulesConfig, mainsFractionMax: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748B' }}>Min Raw Std (Flat Rule)</label>
                <input
                  type="number"
                  step="0.001"
                  value={rulesConfig.flatStdMax}
                  onChange={(e) => setRulesConfig({ ...rulesConfig, flatStdMax: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={() => setRulesConfig({ ...SF.DEFAULTS })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0D9488',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Reset to default parameters
              </button>
            </div>
          </div>
        )}

        {/* Replay Controls Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#F1F5F9',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#0D9488',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Play Replay'}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              if (session) setReplayPos(session.t[0]);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={15} />
            To Start
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
            <span>Speed:</span>
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontWeight: 700 }}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <input
              type="range"
              min={session?.t[0] ?? 0}
              max={session ? session.t[session.t.length - 1] : 15}
              step={0.01}
              value={replayPos}
              onChange={(e) => setReplayPos(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer' }}
            />
          </div>

          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', minWidth: '90px', textAlign: 'right' }}>
            {replayPos.toFixed(2)}s / {session?.meta.durationS.toFixed(1) ?? 15}s
          </div>
        </div>

        {/* Hover / Playhead Readout Bar */}
        {activeFb && session && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: activeFb.quality === 'ok' ? '#F0FDF4' : '#FEF3C7',
              border: `1px solid ${activeFb.quality === 'ok' ? '#BBF7D0' : '#FCD34D'}`,
              marginBottom: '16px',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <b style={{ color: activeFb.quality === 'ok' ? '#15803D' : '#B45309' }}>
                {activeFb.levelText}
              </b>{' '}
              · {activeFb.qualityText}
            </div>
            <div style={{ display: 'flex', gap: '14px', color: '#475569' }}>
              <span>
                t = <b>{activeTime.toFixed(3)}s</b>
              </span>
              <span>
                Raw: <b>{session.raw[activeIdx]?.toFixed(3)}</b>
              </span>
              <span>
                Proc: <b>{session.processed[activeIdx]?.toFixed(3)}</b>
              </span>
              <span>
                Env: <b>{session.envelope[activeIdx]?.toFixed(3)}</b>
              </span>
            </div>
          </div>
        )}

        {/* Chart 1: Raw Contaminated EMG */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8E3FB0' }} />
            <b style={{ fontSize: '14px', color: '#0F172A' }}>1. Raw Contaminated EMG</b>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              (Electrode signal with baseline drift and 50 Hz powerline interference)
            </span>
          </div>
          <canvas
            ref={rawCanvasRef}
            width={640}
            height={130}
            onPointerMove={handlePointerTime}
            onPointerLeave={() => setHoverTime(null)}
            onPointerDown={handlePointerTime}
            style={{
              width: '100%',
              height: '130px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              cursor: 'crosshair',
              display: 'block',
            }}
          />
        </div>

        {/* Chart 2: Processed EMG */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0284C7' }} />
            <b style={{ fontSize: '14px', color: '#0F172A' }}>2. Processed EMG</b>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              (Filtered with 20 Hz high-pass & 50 Hz notch filter)
            </span>
          </div>
          <canvas
            ref={procCanvasRef}
            width={640}
            height={130}
            onPointerMove={handlePointerTime}
            onPointerLeave={() => setHoverTime(null)}
            onPointerDown={handlePointerTime}
            style={{
              width: '100%',
              height: '130px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              cursor: 'crosshair',
              display: 'block',
            }}
          />
        </div>

        {/* Chart 3: Extracted Activity Envelope */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0D9488' }} />
            <b style={{ fontSize: '14px', color: '#0F172A' }}>3. Extracted Activity Envelope</b>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              (Smooth muscular activity curve with dashed illustrative threshold)
            </span>
          </div>
          <canvas
            ref={envCanvasRef}
            width={640}
            height={130}
            onPointerMove={handlePointerTime}
            onPointerLeave={() => setHoverTime(null)}
            onPointerDown={handlePointerTime}
            style={{
              width: '100%',
              height: '130px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              cursor: 'crosshair',
              display: 'block',
            }}
          />
        </div>

        {/* Legend */}
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>🟩 Shaded band: Simulated Contraction Interval</span>
          <span>🟧 Yellow line: Playhead position</span>
          <span>⬛ Dashed line: Illustrative Threshold</span>
          <span>Click or drag cursor across waveforms to scrub position</span>
        </div>
      </div>
    </div>
  );
};
