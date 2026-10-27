import React, { useEffect, useRef, useState } from 'react';
import { HistoryWindowCard } from '../components/HistoryWindowCard';
import { PatientBiofeedbackCard } from '../components/PatientBiofeedbackCard';
import { SignalSimulatorCard } from '../components/SignalSimulatorCard';
import { MqttConnectionStatus, MqttPacket, MqttService } from '../services/mqttService';
import { ClinicianLogRow, HistorySessionRecord } from '../types';

export interface PatientTrainingSuiteProps {
  onSessionCompleteForClinician?: (log: ClinicianLogRow[]) => void;
  replayingSession?: any;
}

const STORAGE_KEY_HISTORY = 'pelvicoach_history_records';
const STORAGE_KEY_TARGET = 'pelvicoach_adaptive_target';
const STORAGE_KEY_HOLD = 'pelvicoach_adaptive_hold';

export const PatientTrainingSuite: React.FC<PatientTrainingSuiteProps> = ({
  onSessionCompleteForClinician,
  replayingSession,
}) => {
  // Adaptive settings loaded from history
  const [targetPercentage, setTargetPercentage] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TARGET);
    return saved ? Number(saved) : 30;
  });
  const [holdSeconds, setHoldSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HOLD);
    return saved ? Number(saved) : 3;
  });
  const [goalReps] = useState<number>(8);

  // Training phase
  const [phase, setPhase] = useState<'idle' | 'cal' | 'rest' | 'hold'>('idle');
  const [goodRepsDone, setGoodRepsDone] = useState<number>(0);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [phaseTimer, setPhaseTimer] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [fails, setFails] = useState<number>(0);

  // Simulator controls
  const [pfSlider, setPfSlider] = useState<number>(5);
  const [abSlider, setAbSlider] = useState<number>(3);
  const [fault, setFault] = useState<number>(0); // 0=none, 1=lift-off, 2=mains
  const [isAutoDemo, setIsAutoDemo] = useState<boolean>(false);
  const [sourceMode, setSourceMode] = useState<'sim' | 'live' | 'replay'>('sim');

  // MQTT state
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus>(() => MqttService.getStatus());
  const [packetCount, setPacketCount] = useState<number>(() => MqttService.getPacketCount());
  const latestMqttPacketRef = useRef<MqttPacket | null>(MqttService.getLastPacket());

  // Calibration state
  const [calMvt, setCalMvt] = useState<number>(0);
  const [calMvc, setCalMvc] = useState<number>(100);

  // Live rolling history for canvas (200 samples)
  const [canvasHistory, setCanvasHistory] = useState<Array<{ pp: number; ap: number; q: number }>>([]);
  const [readouts, setReadouts] = useState({ pp: 0, ap: 0, q: 0, comp: false });

  // Current session attempts log
  const [sessionLog, setSessionLog] = useState<ClinicianLogRow[]>([]);

  // Persistent session history
  const [historyRecords, setHistoryRecords] = useState<HistorySessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'init-1',
        timestamp: new Date(Date.now() - 86400000 * 2).toLocaleDateString() + ' 10:30 AM',
        durationSeconds: 120,
        totalAttempts: 9,
        goodReps: 8,
        targetPercentage: 25,
        holdSeconds: 3,
        accuracyRate: 89,
        adaptiveChange: 'Consistent holds achieved (+5% target earned)',
        log: [],
      },
    ];
  });

  // Repetition accumulator ref during hold phase
  const repRef = useRef<{
    n: number;
    v: number;
    p: number;
    np: number;
    c: number;
    bad: number;
    pf: number;
    lq: number;
    tgt: number;
    hold: number;
  }>({ n: 0, v: 0, p: 0, np: 0, c: 0, bad: 0, pf: 0, lq: 0, tgt: targetPercentage, hold: holdSeconds });

  const phaseStartRef = useRef<number>(performance.now());
  const QN = ['ok', 'flat (lift-off)', 'mains noise'];

  // Subscribe to persistent MQTT service
  useEffect(() => {
    const unsubStatus = MqttService.addStatusListener((status) => {
      setMqttStatus(status);
      if (status === 'connected') {
        setSourceMode('live');
      }
    });

    const unsubPacket = MqttService.addPacketListener((pkt) => {
      latestMqttPacketRef.current = pkt;
      setPacketCount(MqttService.getPacketCount());
      // When live Wokwi packets stream in, update sliders and mode immediately!
      setSourceMode('live');
      setPfSlider(pkt.pf);
      setAbSlider(pkt.ab);
      setFault(pkt.q);
    });

    return () => {
      unsubStatus();
      unsubPacket();
    };
  }, []);

  // Feature extraction helper
  const extractFeature = () => {
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const noise = () => Math.random() + Math.random() + Math.random() - 1.5;

    let pfVal = 4 + 0.96 * pfSlider + noise() * 1.2;
    let abVal = 4 + 0.96 * abSlider + noise() * 1.2;
    let mrVal = 0.02 + Math.random() * 0.03;
    let qVal = 0;

    // IF in LIVE mode or MQTT is actively connected, POT directly drives readings!
    if (sourceMode === 'live' || mqttStatus === 'connected') {
      const pkt = latestMqttPacketRef.current;
      if (pkt) {
        pfVal = pkt.pf;
        abVal = pkt.ab;
        mrVal = pkt.mr;
        qVal = pkt.q;
      }
    } else if (sourceMode === 'replay' && replayingSession) {
      pfVal = 4 + 0.96 * pfSlider;
    } else {
      if (fault === 1) pfVal = 0.4 + Math.random() * 0.3;
      if (fault === 2) {
        pfVal += 38;
        mrVal = 0.55 + Math.random() * 0.1;
      }
    }

    const q = qVal !== 0 ? qVal : pfVal < 1.5 ? 1 : mrVal > 0.35 ? 2 : 0;
    const pp = clamp(((pfVal - 4) / (calMvc - 4)) * 100, 0, 130);
    const ap = clamp(((abVal - 4) / (calMvc - 4)) * 100, 0, 130);
    const comp = ap > 20 && ap > 0.5 * pp;

    return { pf: pfVal, ab: abVal, mr: mrVal, q, pp, ap, comp };
  };

  // End repetition and apply adaptive algorithm
  const endRepetition = (now: number) => {
    const a = repRef.current;
    const vf = a.n > 0 ? a.v / a.n : 0;
    const nv = a.n > 0 ? a.np / a.n >= 0.8 : false;
    const bad = a.n > 0 ? a.bad / a.n > 0.3 : false;

    let res: ClinicianLogRow['res'] = 'MISS';
    let why = '';

    if (vf < 0.7) {
      res = 'INVALID';
      why = 'signal rejected (' + (QN[a.lq] || 'sensor fault') + '): not scored, repeat';
    } else if (a.v > 0 && a.c / a.v > 0.3) {
      res = 'COMPENSATED';
      why = 'abdominal co-activation detected: relax tummy';
    } else if (a.v > 0 && a.p / a.v >= 0.8) {
      res = 'OK';
      why = 'target held steady on valid windows';
    } else {
      res = 'MISS';
      why = 'contraction below target on valid windows';
    }

    let adaptNote = '';
    if (res !== 'INVALID') {
      const nextDone = goodRepsDone + (res === 'OK' ? 1 : 0);
      setGoodRepsDone(nextDone);

      if (res === 'OK') {
        setFails(0);
        const newStreak = streak + 1;
        setStreak(newStreak);

        // Adaptive upward target adjustment: 3 clean reps in a row!
        if (newStreak >= 3) {
          setStreak(0);
          if (holdSeconds < 8 && nextDone % 2 !== 0) {
            const nextHold = holdSeconds + 1;
            setHoldSeconds(nextHold);
            localStorage.setItem(STORAGE_KEY_HOLD, String(nextHold));
            why += ' → hold duration +1s';
            adaptNote = 'High stamina! Hold adapted to ' + nextHold + 's';
          } else {
            const nextTarget = Math.min(80, targetPercentage + 5);
            setTargetPercentage(nextTarget);
            localStorage.setItem(STORAGE_KEY_TARGET, String(nextTarget));
            why += ' → target +5%';
            adaptNote = '3 good reps streak! Target adapted to ' + nextTarget + '% (+5%)';
          }
        }
      } else {
        setStreak(0);
        const newFails = fails + 1;
        setFails(newFails);

        // Adaptive easing: 2 consecutive fatigue / compensated attempts
        if (newFails >= 2) {
          setFails(0);
          const nextHold = Math.max(2, holdSeconds - 1);
          const nextTarget = Math.max(15, targetPercentage - 5);
          setHoldSeconds(nextHold);
          setTargetPercentage(nextTarget);
          localStorage.setItem(STORAGE_KEY_HOLD, String(nextHold));
          localStorage.setItem(STORAGE_KEY_TARGET, String(nextTarget));
          why += ' → target eased -5% to prevent fatigue';
          adaptNote = 'Fatigue relief: Target eased to ' + nextTarget + '%';
        }
      }

      // Check if session completed
      if (nextDone >= goalReps) {
        setPhase('idle');
        setIsAutoDemo(false);

        // Save session record to persistent history
        const newHistoryRecord: HistorySessionRecord = {
          id: 'ses-' + Date.now(),
          timestamp:
            new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationSeconds: Math.round((now - phaseStartRef.current) / 1000),
          totalAttempts: attemptsCount + 1,
          goodReps: nextDone,
          targetPercentage,
          holdSeconds,
          accuracyRate: Math.round((nextDone / Math.max(1, attemptsCount + 1)) * 100),
          adaptiveChange: adaptNote || 'Flexible target updated based on performance',
          log: [...sessionLog],
        };

        const updatedHistory = [newHistoryRecord, ...historyRecords];
        setHistoryRecords(updatedHistory);
        try {
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory.slice(0, 30)));
        } catch {
          // ignore
        }
        return;
      }
    }

    const logEntry: ClinicianLogRow = {
      n: attemptsCount + 1,
      res,
      tgt: a.tgt,
      hold: a.hold,
      avg: a.v ? Math.round(a.pf / a.v) : 0,
      why,
      nv: nv ? (bad ? 'credit (FALSE)' : 'credit') : 'no credit',
      fc: nv && bad,
      timestamp: new Date().toLocaleTimeString(),
    };

    setSessionLog((prev) => {
      const next = [...prev, logEntry];
      if (onSessionCompleteForClinician) onSessionCompleteForClinician(next);
      return next;
    });

    // Enter rest phase
    setPhase('rest');
    phaseStartRef.current = now;
  };

  // Auto demo driver
  const driveAutoDemo = (k: number) => {
    if (phase === 'cal') {
      setPfSlider(95);
    } else if (phase === 'hold') {
      setAbSlider(3);
      setFault(0);
      let pf = Math.min(100, targetPercentage + 14);
      if (k === 2) pf = targetPercentage * 0.5; // Miss
      if (k === 3) setFault(1); // Lift-off
      if (k === 5) setFault(2); // Mains noise
      if (k === 7) {
        setAbSlider(70);
        pf = Math.min(100, targetPercentage + 15);
      } // Compensation
      setPfSlider(pf);
    } else {
      setPfSlider(5);
      setAbSlider(3);
      setFault(0);
    }
  };

  // Main 50ms engine tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const f = extractFeature();

      if (isAutoDemo) {
        driveAutoDemo(attemptsCount);
      }

      setReadouts({ pp: f.pp, ap: f.ap, q: f.q, comp: f.comp });

      // Rolling canvas history
      setCanvasHistory((prev) => {
        const next = [...prev, { pp: f.pp, ap: f.ap, q: f.q }];
        if (next.length > 200) next.shift();
        return next;
      });

      const elapsed = (now - phaseStartRef.current) / 1000;

      if (phase === 'cal') {
        if (f.q === 0) {
          setCalMvt((m) => Math.max(m, f.pf));
        }
        setPhaseTimer(Math.max(0, 4 - elapsed));
        if (elapsed >= 4) {
          setCalMvc(Math.max(30, calMvt));
          setPhase('idle');
          if (isAutoDemo) {
            // Auto start session
            setGoodRepsDone(0);
            setAttemptsCount(0);
            setSessionLog([]);
            setStreak(0);
            setFails(0);
            setPhase('rest');
            phaseStartRef.current = now;
          }
        }
      } else if (phase === 'rest') {
        setPhaseTimer(Math.max(0, 3 - elapsed));
        if (elapsed >= 3) {
          const nextAttempt = attemptsCount + 1;
          setAttemptsCount(nextAttempt);
          repRef.current = {
            n: 0,
            v: 0,
            p: 0,
            np: 0,
            c: 0,
            bad: 0,
            pf: 0,
            lq: 0,
            tgt: targetPercentage,
            hold: holdSeconds,
          };
          setPhase('hold');
          phaseStartRef.current = now;
        }
      } else if (phase === 'hold') {
        const a = repRef.current;
        a.n++;
        if (f.pp >= targetPercentage) a.np++;
        if (f.q || f.comp) a.bad++;
        if (f.q === 0) {
          a.v++;
          a.pf += f.pp;
          if (f.pp >= targetPercentage) a.p++;
          if (f.comp) a.c++;
        } else {
          a.lq = f.q;
        }

        setPhaseTimer(Math.max(0, holdSeconds - elapsed));
        if (elapsed >= holdSeconds) {
          endRepetition(now);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [
    phase,
    pfSlider,
    abSlider,
    fault,
    calMvc,
    calMvt,
    targetPercentage,
    holdSeconds,
    attemptsCount,
    goodRepsDone,
    streak,
    fails,
    isAutoDemo,
    sourceMode,
    mqttStatus,
  ]);

  const handleStartCalibration = () => {
    setIsAutoDemo(false);
    setCalMvt(0);
    setPhase('cal');
    phaseStartRef.current = performance.now();
  };

  const handleStartSession = () => {
    setIsAutoDemo(false);
    setGoodRepsDone(0);
    setAttemptsCount(0);
    setSessionLog([]);
    setStreak(0);
    setFails(0);
    setPhase('rest');
    phaseStartRef.current = performance.now();
  };

  const handleRunAutoDemo = () => {
    setCalMvt(0);
    setIsAutoDemo(true);
    setPhase('cal');
    phaseStartRef.current = performance.now();
  };

  const handleReset = () => {
    setIsAutoDemo(false);
    setPhase('idle');
    setPfSlider(5);
    setAbSlider(3);
    setFault(0);
    setGoodRepsDone(0);
    setAttemptsCount(0);
  };

  const handleSourceModeChange = (mode: 'sim' | 'live' | 'replay') => {
    setSourceMode(mode);
    if (mode === 'live' && mqttStatus !== 'connected') {
      MqttService.connect();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Side-by-Side Responsive Grid for Patient Screen and Signal Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '20px' }}>
        {/* Left: Patient Screen Card with Big One-Word Warnings & Visual Biofeedback */}
        <PatientBiofeedbackCard
          phase={phase}
          squeezePercent={readouts.pp}
          targetPercentage={targetPercentage}
          holdSeconds={holdSeconds}
          goodRepsDone={goodRepsDone}
          goalReps={goalReps}
          signalQuality={readouts.q}
          compensation={readouts.comp}
          phaseTimerRemaining={phaseTimer}
          onCalibrate={handleStartCalibration}
          onStartSession={handleStartSession}
          onRunAutoDemo={handleRunAutoDemo}
          onReset={handleReset}
          sourceMode={sourceMode}
          onSourceModeChange={handleSourceModeChange}
          mqttStatus={mqttStatus}
          onConnectMqtt={() => MqttService.connect()}
          onDisconnectMqtt={() => MqttService.disconnect()}
          packetCount={packetCount}
        />

        {/* Right: Signal Simulator Card with Sliders, Fault Triggers & Oscilloscope Canvas */}
        <SignalSimulatorCard
          pfSqueeze={pfSlider}
          abActivity={abSlider}
          onPfChange={(val) => {
            setPfSlider(val);
            if (sourceMode === 'live') setSourceMode('sim');
          }}
          onAbChange={(val) => setAbSlider(val)}
          fault={fault}
          onToggleFault={(f) => setFault((prev) => (prev === f ? 0 : f))}
          history={canvasHistory}
          targetPercentage={targetPercentage}
          readouts={readouts}
          isReplayMode={sourceMode === 'replay'}
        />
      </div>

      {/* History Window: Session Progression & Flexible Target Tracker */}
      <HistoryWindowCard
        sessions={historyRecords}
        currentAdaptiveTarget={targetPercentage}
        currentAdaptiveHold={holdSeconds}
        streak={streak}
        onClearHistory={() => {
          localStorage.removeItem(STORAGE_KEY_HISTORY);
          setHistoryRecords([]);
        }}
      />
    </div>
  );
};
