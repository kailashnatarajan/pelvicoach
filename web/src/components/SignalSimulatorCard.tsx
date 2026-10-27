import { Activity, AlertTriangle, Cpu, Radio, ShieldAlert, Zap } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

export interface SignalSimulatorProps {
  pfSqueeze: number;
  abActivity: number;
  onPfChange: (val: number) => void;
  onAbChange: (val: number) => void;
  fault: number; // 0 = none, 1 = lift-off, 2 = mains noise
  onToggleFault: (faultType: number) => void;
  history: Array<{ pp: number; ap: number; q: number }>;
  targetPercentage: number;
  readouts: {
    pp: number;
    ap: number;
    q: number;
    comp: boolean;
  };
  isReplayMode?: boolean;
}

export const SignalSimulatorCard: React.FC<SignalSimulatorProps> = ({
  pfSqueeze,
  abActivity,
  onPfChange,
  onAbChange,
  fault,
  onToggleFault,
  history,
  targetPercentage,
  readouts,
  isReplayMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render rolling oscilloscope canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const Y = (v: number) => H - 8 - (clamp(v, 0, 110) / 110) * (H - 16);

    // Draw rejected background regions (fault / artifact)
    history.forEach((pt, i) => {
      if (pt.q) {
        ctx.fillStyle = '#EF4444';
        ctx.globalAlpha = 0.28;
        ctx.fillRect((i * W) / 200, 0, W / 200 + 1, H);
        ctx.globalAlpha = 1.0;
      }
    });

    // Draw dashed target line
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, Y(targetPercentage));
    ctx.lineTo(W, Y(targetPercentage));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw pelvic floor trace (blue / teal)
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const y = Y(pt.pp);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo((i * W) / 200, y);
    });
    ctx.stroke();

    // Draw abdominal trace (amber)
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    history.forEach((pt, i) => {
      const y = Y(pt.ap);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo((i * W) / 200, y);
    });
    ctx.stroke();
  }, [history, targetPercentage]);

  const signalQualityNames = ['Clean (OK)', 'Flat (Lift-off)', 'Mains (50Hz) Noise'];

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '19px',
              background: '#E0F2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284C7',
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>Signal Simulator</h3>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
              Live physiological sensor emulator & fault injection
            </p>
          </div>
        </div>
        {isReplayMode && (
          <span
            style={{
              background: '#EEF2FF',
              color: '#4F46E5',
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #C7D2FE',
            }}
          >
            Replaying File
          </span>
        )}
      </div>

      {isReplayMode && (
        <div
          style={{
            background: '#F0FDFA',
            borderLeft: '4px solid #0D9488',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#134E4A',
            marginBottom: '16px',
            fontWeight: 600,
          }}
        >
          Signal driven by imported replay file. Use the abdominal slider to simulate co-activation alongside file replay.
        </div>
      )}

      {/* Sliders */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
          <label style={{ fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#0284C7' }} />
            Pelvic Floor Squeeze
          </label>
          <span style={{ fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(pfSqueeze)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={pfSqueeze}
          disabled={isReplayMode}
          onChange={(e) => onPfChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#0284C7', cursor: isReplayMode ? 'not-allowed' : 'pointer' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
          <label style={{ fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#D97706' }} />
            Abdominal Activity (Tummy)
          </label>
          <span style={{ fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(abActivity)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={abActivity}
          onChange={(e) => onAbChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer' }}
        />
      </div>

      {/* Fault Injection Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => onToggleFault(1)}
          disabled={isReplayMode}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: `2px solid ${fault === 1 ? '#EF4444' : '#CBD5E1'}`,
            background: fault === 1 ? '#FEE2E2' : '#F8FAFC',
            color: fault === 1 ? '#DC2626' : '#334155',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isReplayMode ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldAlert size={18} />
          {fault === 1 ? 'Electrode Lifted [ACTIVE]' : 'Electrode Lift-Off'}
        </button>

        <button
          type="button"
          onClick={() => onToggleFault(2)}
          disabled={isReplayMode}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: `2px solid ${fault === 2 ? '#EF4444' : '#CBD5E1'}`,
            background: fault === 2 ? '#FEE2E2' : '#F8FAFC',
            color: fault === 2 ? '#DC2626' : '#334155',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isReplayMode ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Zap size={18} />
          {fault === 2 ? '50 Hz Mains [ACTIVE]' : 'Mains (50 Hz) Noise'}
        </button>
      </div>

      {/* Canvas Oscilloscope */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          style={{
            width: '100%',
            height: '160px',
            background: '#F1F5F9',
            borderRadius: '12px',
            display: 'block',
            border: '1px solid #E2E8F0',
          }}
        />
        {readouts.comp && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertTriangle size={14} />
            Compensation Warning
          </div>
        )}
      </div>

      {/* Status Readouts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginTop: '14px',
          padding: '12px',
          background: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          fontSize: '13px',
        }}
      >
        <div>
          <span style={{ color: '#64748B', display: 'block' }}>Squeeze</span>
          <b style={{ color: '#0F172A', fontSize: '16px' }}>{Math.round(readouts.pp)}%</b>
          <span style={{ fontSize: '11px', color: '#64748B' }}> of max</span>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block' }}>Abdomen</span>
          <b style={{ color: '#0F172A', fontSize: '16px' }}>{Math.round(readouts.ap)}%</b>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block' }}>Signal Quality</span>
          <b style={{ color: readouts.q ? '#DC2626' : '#15803D', fontSize: '14px' }}>
            {signalQualityNames[readouts.q]}
          </b>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block' }}>Compensation</span>
          <b style={{ color: readouts.comp ? '#D97706' : '#15803D', fontSize: '14px' }}>
            {readouts.comp ? 'YES (Stomach)' : 'NO (Isolating)'}
          </b>
        </div>
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748B', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#0284C7', borderRadius: '2px' }} />
          Blue: Pelvic Floor
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#D97706', borderRadius: '2px' }} />
          Amber: Abdomen
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '14px', height: '2px', borderTop: '2px dashed #334155' }} />
          Dashed: Target Line
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#EF4444', opacity: 0.35, borderRadius: '2px' }} />
          Red Band: Signal Rejected
        </span>
      </div>
    </div>
  );
};
