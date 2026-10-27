import {
  AlertTriangle,
  ArrowUp,
  Award,
  CheckCircle2,
  Feather,
  Flame,
  Gauge,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import React from 'react';

export interface PatientBiofeedbackProps {
  phase: 'idle' | 'cal' | 'rest' | 'hold';
  squeezePercent: number; // 0 - 130%
  targetPercentage: number;
  holdSeconds: number;
  goodRepsDone: number;
  goalReps: number;
  signalQuality: number; // 0 = ok, 1 = lift-off, 2 = mains noise
  compensation: boolean;
  phaseTimerRemaining: number;
  onCalibrate: () => void;
  onStartSession: () => void;
  onRunAutoDemo: () => void;
  onReset: () => void;
  sourceMode: 'sim' | 'live' | 'replay';
  onSourceModeChange: (mode: 'sim' | 'live' | 'replay') => void;
  mqttStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
  onConnectMqtt?: () => void;
  onDisconnectMqtt?: () => void;
  packetCount?: number;
}

export const PatientBiofeedbackCard: React.FC<PatientBiofeedbackProps> = ({
  phase,
  squeezePercent,
  targetPercentage,
  holdSeconds,
  goodRepsDone,
  goalReps,
  signalQuality,
  compensation,
  phaseTimerRemaining,
  onCalibrate,
  onStartSession,
  onRunAutoDemo,
  onReset,
  sourceMode,
  onSourceModeChange,
  mqttStatus = 'disconnected',
  onConnectMqtt,
  onDisconnectMqtt,
  packetCount = 0,
}) => {
  // Determine simple one-word patient warning and friendly subtitle
  let oneWord = 'READY';
  let oneWordSubtitle = 'Press “Calibrate”, then “Start Session”';
  let alertType: 'ok' | 'warn' | 'bad' | 'info' | 'cal' = 'info';

  if (phase === 'cal') {
    oneWord = 'SQUEEZE';
    oneWordSubtitle = `Squeeze as hard as comfortable… ${Math.max(0, Math.ceil(phaseTimerRemaining))}s`;
    alertType = 'cal';
  } else if (phase === 'rest') {
    oneWord = 'RELAX';
    oneWordSubtitle = `Release completely and breathe normally… ${Math.max(0, Math.ceil(phaseTimerRemaining))}s`;
    alertType = 'info';
  } else if (phase === 'hold') {
    if (signalQuality === 1) {
      oneWord = 'LIFTED';
      oneWordSubtitle = 'Electrode patch lifted off. Press patch firmly against skin.';
      alertType = 'bad';
    } else if (signalQuality === 2) {
      oneWord = 'NOISY';
      oneWordSubtitle = '50 Hz noise detected. Move away from chargers or wall sockets.';
      alertType = 'bad';
    } else if (compensation) {
      oneWord = 'STOMACH';
      oneWordSubtitle = 'Relax tummy and thighs. Squeeze only pelvic floor.';
      alertType = 'warn';
    } else if (squeezePercent >= targetPercentage) {
      oneWord = 'GOOD';
      oneWordSubtitle = `Target reached! Hold steady… ${Math.max(0, Math.ceil(phaseTimerRemaining))}s`;
      alertType = 'ok';
    } else {
      oneWord = 'TIGHTEN';
      oneWordSubtitle = `Gently squeeze a bit more… ${Math.max(0, Math.ceil(phaseTimerRemaining))}s`;
      alertType = 'warn';
    }
  } else if (phase === 'idle' && goodRepsDone >= goalReps) {
    oneWord = 'COMPLETED';
    oneWordSubtitle = 'Exercise complete! Outstanding workout session.';
    alertType = 'ok';
  }

  // Styles based on alertType
  const alertStyles = {
    ok: { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', icon: <CheckCircle2 size={28} /> },
    warn: { bg: '#FEF3C7', border: '#FCD34D', text: '#B45309', icon: <AlertTriangle size={28} /> },
    bad: { bg: '#FEE2E2', border: '#FCA5A5', text: '#DC2626', icon: <Zap size={28} /> },
    info: { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1', icon: <Feather size={28} /> },
    cal: { bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE', icon: <Sparkles size={28} /> },
  }[alertType];

  // Orb and Target ring dimensions
  const orbSize = Math.max(34, Math.min(260, 36 + squeezePercent * 2.2));
  const targetRingSize = Math.max(34, Math.min(260, 36 + targetPercentage * 2.2));

  // Determine orb color
  let orbBg = '#0D9488';
  if (signalQuality !== 0) {
    orbBg = '#EF4444';
  } else if (compensation) {
    orbBg = '#F59E0B';
  } else if (squeezePercent >= targetPercentage) {
    orbBg = '#10B981';
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* Top Header & Signal Source */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gauge size={26} color="#0D9488" />
            Patient Screen
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            Visual biofeedback with instant one-word physiological coaching
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="sourceSelect" style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
              Source:
            </label>
            <select
              id="sourceSelect"
              value={sourceMode}
              onChange={(e) => onSourceModeChange(e.target.value as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 700,
                background: '#FFFFFF',
                color: '#0F172A',
              }}
            >
              <option value="sim">Built-in Simulator</option>
              <option value="live">Wokwi Live (MQTT)</option>
              <option value="replay">Imported Session Replay</option>
            </select>
          </div>

          {/* MQTT Connect/Disconnect button when in Live mode or connecting */}
          {(sourceMode === 'live' || mqttStatus === 'connected' || mqttStatus === 'connecting') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {mqttStatus === 'connected' ? (
                <button
                  type="button"
                  onClick={onDisconnectMqtt}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #86EFAC',
                    background: '#F0FDF4',
                    color: '#15803D',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  title="Click to disconnect from HiveMQ MQTT broker"
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#22C55E' }} />
                  MQTT Live {packetCount > 0 && `(${packetCount} pkts)`} · Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnectMqtt}
                  disabled={mqttStatus === 'connecting'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#16A34A',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={14} />
                  {mqttStatus === 'connecting' ? 'Connecting MQTT...' : 'Connect Wokwi MQTT'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Wokwi Notice if Connected */}
      {mqttStatus === 'connected' && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '5px', background: '#22C55E' }} />
          <span>
            <b>Live Wokwi Stream Active:</b> Turn the potentiometer in the Wokwi ESP32 simulation to control the Pelvic Floor Biofeedback below in real time!
          </span>
        </div>
      )}

      {/* ONE-WORD PATIENT-FRIENDLY WARNING BANNER */}
      <div
        role="status"
        aria-live="polite"
        style={{
          background: alertStyles.bg,
          border: `2px solid ${alertStyles.border}`,
          borderRadius: '16px',
          padding: '16px 20px',
          textAlign: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span style={{ color: alertStyles.text }}>{alertStyles.icon}</span>
          <span
            style={{
              fontSize: '34px',
              fontWeight: 900,
              color: alertStyles.text,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {oneWord}
          </span>
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: alertStyles.text, marginTop: '4px', opacity: 0.9 }}>
          {oneWordSubtitle}
        </p>
      </div>

      {/* Visual Feedback Stage */}
      <div
        style={{
          position: 'relative',
          height: '280px',
          margin: '12px 0 16px',
          background: 'radial-gradient(circle, #F8FAFC 0%, #EDF2F7 100%)',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Outer Dashed Target Ring */}
        <div
          style={{
            position: 'absolute',
            width: `${targetRingSize}px`,
            height: `${targetRingSize}px`,
            borderRadius: '50%',
            border: '4px dashed #334155',
            pointerEvents: 'none',
            transition: 'width 0.2s ease, height 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-14px',
              background: '#334155',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            Target {targetPercentage}%
          </span>
        </div>

        {/* Inner Biofeedback Orb */}
        <div
          style={{
            position: 'absolute',
            width: `${orbSize}px`,
            height: `${orbSize}px`,
            borderRadius: '50%',
            backgroundColor: orbBg,
            opacity: 0.88,
            boxShadow: `0 0 28px ${orbBg}88`,
            transition: 'width 0.08s ease-out, height 0.08s ease-out, background-color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: orbSize > 70 ? '16px' : '12px',
          }}
        >
          {orbSize > 65 && `${Math.round(squeezePercent)}%`}
        </div>
      </div>

      {/* Session Progress Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: '#F1F5F9',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 700,
          color: '#334155',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={18} color="#0D9488" />
          Good Reps: <b style={{ color: '#0F172A', fontSize: '16px' }}>{goodRepsDone}</b> / {goalReps}
        </span>
        <span>
          Target: <b style={{ color: '#0F172A' }}>{targetPercentage}%</b>
        </span>
        <span>
          Hold: <b style={{ color: '#0F172A' }}>{holdSeconds}s</b>
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <button
          type="button"
          onClick={onCalibrate}
          disabled={phase === 'cal'}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            border: '2px solid #0D9488',
            background: phase === 'cal' ? '#CCFBF1' : '#FFFFFF',
            color: '#0F766E',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          1. Calibrate (4s)
        </button>

        <button
          type="button"
          onClick={onStartSession}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Play size={16} />
          2. Start Session
        </button>

        <button
          type="button"
          onClick={onRunAutoDemo}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            border: '2px solid #6366F1',
            background: '#EEF2FF',
            color: '#4338CA',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Sparkles size={16} />
          Run Auto Demo
        </button>

        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            border: '2px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#64748B',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
    </div>
  );
};
