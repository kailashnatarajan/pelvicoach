import { AlertCircle, CheckCircle2, ChevronRight, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { CircularTimer } from '../components/CircularTimer';
import { DemoControlDock } from '../components/DemoControlDock';
import { MuscleActivityGauge } from '../components/MuscleActivityGauge';
import { useAuth } from '../context/AuthContext';
import {
  evaluateAdaptiveTarget,
  getRealtimeFeedback,
  validateRepetition,
} from '../services/biofeedbackEngine';
import { DatabaseService } from '../services/dbService';
import { demoSimulator } from '../services/demoSimulator';
import { Attempt, BiofeedbackReading, Exercise, PatientExercise, RepetitionResult, Session } from '../types';

interface TrainingViewProps {
  exercise: Exercise;
  prescribed: PatientExercise;
  onFinishSession: (sessionData: Omit<Session, 'id' | 'created_at'>, attempts: Array<Omit<Attempt, 'id' | 'session_id' | 'created_at'>>) => void;
  onCancel: () => void;
}

type Phase = 'prepare' | 'contract' | 'relax';

export const TrainingView: React.FC<TrainingViewProps> = ({
  exercise,
  prescribed,
  onFinishSession,
  onCancel,
}) => {
  const { user } = useAuth();
  const [targetPercentage, setTargetPercentage] = useState(prescribed.target_percentage || exercise.default_target);
  const holdDuration = prescribed.hold_seconds || exercise.default_hold;
  const goalRepetitions = prescribed.goal_repetitions || exercise.default_repetitions;

  const [currentRep, setCurrentRep] = useState(1);
  const [successfulReps, setSuccessfulReps] = useState(0);
  const [missedReps, setMissedReps] = useState(0);
  const [compensatedReps, setCompensatedReps] = useState(0);
  const [invalidReps, setInvalidReps] = useState(0);

  const [phase, setPhase] = useState<Phase>('prepare');
  const [remainingSeconds, setRemainingSeconds] = useState(3);
  const [activeFeedback, setActiveFeedback] = useState('Get ready to squeeze gently...');
  const [bannerStatus, setBannerStatus] = useState<'ok' | 'warning' | 'danger' | 'neutral'>('neutral');
  const [lastResult, setLastResult] = useState<RepetitionResult | null>(null);

  const [reading, setReading] = useState<BiofeedbackReading>({
    pelvic_activity: 5,
    abdominal_activity: 5,
    signal_quality: 'GOOD',
    timestamp: Date.now(),
  });

  // Adaptive counters
  const [consecutiveSuccess, setConsecutiveSuccess] = useState(0);
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [adaptiveModalMsg, setAdaptiveModalMsg] = useState<string | null>(null);

  const attemptsRef = useRef<Array<Omit<Attempt, 'id' | 'session_id' | 'created_at'>>>([]);
  const startTimeRef = useRef(new Date().toISOString());
  const timerIntervalRef = useRef<any>(null);
  const readingRef = useRef(reading);
  readingRef.current = reading;

  useEffect(() => {
    const unsub = demoSimulator.subscribe((r) => setReading(r));
    return () => {
      unsub();
      demoSimulator.setContracting(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'prepare') {
      demoSimulator.setContracting(false);
      setActiveFeedback('Get ready to squeeze gently...');
      setBannerStatus('neutral');

      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setPhase('contract');
            setRemainingSeconds(holdDuration);
            demoSimulator.setContracting(true);
            return holdDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'contract') {
      demoSimulator.setContracting(true);

      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const rf = getRealtimeFeedback(readingRef.current, targetPercentage);
          setActiveFeedback(rf.message);
          setBannerStatus(rf.status);

          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            evaluateRepetition();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'relax') {
      demoSimulator.setContracting(false);

      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            if (currentRep >= goalRepetitions) {
              completeWorkout();
            } else {
              setCurrentRep((r) => r + 1);
              setPhase('contract');
              setRemainingSeconds(holdDuration);
              demoSimulator.setContracting(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, currentRep]);

  const evaluateRepetition = () => {
    demoSimulator.setContracting(false);
    const finalReading = readingRef.current;
    const validation = validateRepetition(finalReading, targetPercentage, holdDuration, holdDuration);

    setLastResult(validation.result);
    setActiveFeedback(validation.patientFeedback);

    let updatedSuccess = successfulReps;
    if (validation.result === 'OK') {
      updatedSuccess += 1;
      setSuccessfulReps(updatedSuccess);
      setBannerStatus('ok');
    } else if (validation.result === 'COMPENSATED') {
      setCompensatedReps((p) => p + 1);
      setBannerStatus('danger');
    } else if (validation.result === 'MISS') {
      setMissedReps((p) => p + 1);
      setBannerStatus('warning');
    } else {
      setInvalidReps((p) => p + 1);
      setBannerStatus('neutral');
    }

    attemptsRef.current.push({
      rep_number: currentRep,
      result: validation.result,
      target_percentage: targetPercentage,
      pelvic_activity: finalReading.pelvic_activity,
      abdominal_activity: finalReading.abdominal_activity,
      hold_seconds: holdDuration,
      feedback: validation.patientFeedback,
    });

    // Adaptive training check
    const adaptive = evaluateAdaptiveTarget(validation.result, consecutiveSuccess, consecutiveFails, targetPercentage);
    setConsecutiveSuccess(adaptive.consecutiveSuccess);
    setConsecutiveFails(adaptive.consecutiveFails);

    if (adaptive.hasUpdated) {
      setTargetPercentage(adaptive.newTarget);
      setAdaptiveModalMsg(adaptive.message || null);
      if (user) {
        DatabaseService.updatePatientExercise(user.id, exercise.id, { target_percentage: adaptive.newTarget });
      }
    }

    setPhase('relax');
    setRemainingSeconds(3);
  };

  const completeWorkout = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    demoSimulator.setContracting(false);

    onFinishSession(
      {
        patient_id: user?.id || 'mock-patient-1',
        exercise_id: exercise.id,
        start_time: startTimeRef.current,
        end_time: new Date().toISOString(),
        total_repetitions: currentRep,
        successful_repetitions: successfulReps + (lastResult === 'OK' ? 1 : 0),
        missed_repetitions: missedReps + (lastResult === 'MISS' ? 1 : 0),
        compensated_repetitions: compensatedReps + (lastResult === 'COMPENSATED' ? 1 : 0),
        invalid_repetitions: invalidReps + (lastResult === 'INVALID' ? 1 : 0),
      },
      attemptsRef.current
    );
  };

  const isCompensating =
    reading.abdominal_activity >= 38 ||
    reading.abdominal_activity >= reading.pelvic_activity * 0.55;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>
            Active Training Session
          </span>
          <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#0F172A' }}>{exercise.name}</h2>
        </div>
        <button
          onClick={completeWorkout}
          style={{
            background: '#F1F5F9',
            border: '2px solid #E2E8F0',
            borderRadius: '16px',
            padding: '10px 16px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <X size={18} />
          <span>End Session</span>
        </button>
      </div>

      {/* Circular Timer (Section 16) */}
      <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
        <CircularTimer
          totalSeconds={phase === 'contract' ? holdDuration : 3}
          remainingSeconds={remainingSeconds}
          phase={phase}
        />
      </div>

      {/* Real-time Muscle Activity Gauge (Section 16) */}
      <MuscleActivityGauge
        pelvicActivity={reading.pelvic_activity}
        abdominalActivity={reading.abdominal_activity}
        targetPercentage={targetPercentage}
        isCompensating={isCompensating}
      />

      {/* Repetitions Counter (Section 16) */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 28px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#475569' }}>Repetitions</span>
        <span style={{ fontSize: '28px', fontWeight: 900, color: '#0F766E' }}>
          {Math.min(currentRep, goalRepetitions)} / {goalRepetitions}
        </span>
      </div>

      {/* Large Patient-Friendly Feedback Banner (Section 16 & 20) */}
      <div
        className={`feedback-banner feedback-${bannerStatus}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '22px 28px',
          borderRadius: '22px',
        }}
      >
        {bannerStatus === 'ok' ? (
          <CheckCircle2 size={36} color="#15803D" />
        ) : (
          <AlertCircle size={36} color={bannerStatus === 'danger' ? '#DC2626' : '#D97706'} />
        )}
        <span style={{ flex: 1 }}>{activeFeedback}</span>
      </div>

      {/* Floating Demo Dock for Presenter */}
      <DemoControlDock />

      {/* Adaptive Target Alert Modal (Section 21) */}
      {adaptiveModalMsg && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '36px',
                background: '#CCFBF1',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F766E',
                marginBottom: '16px',
              }}
            >
              <TrendingUp size={40} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
              YOUR TARGET HAS BEEN UPDATED
            </h3>
            <p style={{ fontSize: '18px', color: '#334155', lineHeight: 1.5, marginBottom: '24px' }}>
              {adaptiveModalMsg}
            </p>
            <button className="btn btn-primary" onClick={() => setAdaptiveModalMsg(null)}>
              CONTINUE SESSION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
