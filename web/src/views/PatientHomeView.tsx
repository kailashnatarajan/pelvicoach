import { CheckCircle2, Play, Sparkles, Video } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { VideoModal } from '../components/VideoModal';
import { DEFAULT_EXERCISES } from '../constants/exercises';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { Exercise, PatientExercise } from '../types';

interface PatientHomeViewProps {
  onStartExercise: (exercise: Exercise, prescribed: PatientExercise) => void;
}

export const PatientHomeView: React.FC<PatientHomeViewProps> = ({ onStartExercise }) => {
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise>(DEFAULT_EXERCISES[0]);
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [prescribed, setPrescribed] = useState<PatientExercise | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<Exercise>(DEFAULT_EXERCISES[0]);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    const exList = await DatabaseService.getExercises();
    setExercises(exList);
    const active = exList[0] || DEFAULT_EXERCISES[0];
    setExercise(active);

    const plan = await DatabaseService.getPatientExercise(user.id, active.id);
    setPrescribed(plan);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const goalReps = prescribed?.goal_repetitions ?? exercise.default_repetitions;
  const holdSecs = prescribed?.hold_seconds ?? exercise.default_hold;
  const targetPct = prescribed?.target_percentage ?? exercise.default_target;

  return (
    <div>
      {/* Top Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-hero">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-subhero">Ready for today's gentle rehabilitation session?</p>
      </div>

      {/* TODAY'S EXERCISE Primary Card (Section 10) */}
      <div className="card card-highlight" style={{ padding: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#CCFBF1',
            color: '#0F766E',
            fontSize: '14px',
            fontWeight: 900,
            padding: '6px 14px',
            borderRadius: '20px',
            marginBottom: '16px',
            letterSpacing: '0.8px',
          }}
        >
          <Sparkles size={16} />
          <span>TODAY'S EXERCISE</span>
        </div>

        <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
          {exercise.name}
        </h2>
        <p
          style={{
            fontSize: '20px',
            color: '#334155',
            fontStyle: 'italic',
            lineHeight: 1.5,
            marginBottom: '20px',
          }}
        >
          "{exercise.description}"
        </p>

        {/* Prescription Metrics Row */}
        <div className="metrics-row">
          <div className="metric-col">
            <div className="metric-label">Goal</div>
            <div className="metric-value">{goalReps}</div>
            <div className="metric-unit">repetitions</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <div className="metric-label">Hold</div>
            <div className="metric-value">{holdSecs}</div>
            <div className="metric-unit">seconds</div>
          </div>
          <div className="metric-divider" />
          <div className="metric-col">
            <div className="metric-label">Target</div>
            <div className="metric-value">{targetPct}%</div>
            <div className="metric-unit">intensity</div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '24px' }}>
          <button
            className="btn btn-primary"
            onClick={() => onStartExercise(exercise, prescribed || {
              id: 'plan',
              patient_id: user?.id || '1',
              exercise_id: exercise.id,
              target_percentage: targetPct,
              hold_seconds: holdSecs,
              goal_repetitions: goalReps
            })}
          >
            <Play size={24} fill="#FFFFFF" />
            <span>START EXERCISE</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedVideoExercise(exercise);
              setShowVideoModal(true);
            }}
          >
            <Video size={22} />
            <span>WATCH HOW TO DO IT</span>
          </button>
        </div>
      </div>

      {/* Exercise Library Section (Section 13) */}
      <h3 className="text-section-title" style={{ marginTop: '36px' }}>
        Prescribed Exercise Library
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {exercises.map((item) => (
          <div key={item.id} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      background: '#F1F5F9',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '10px',
                    }}
                  >
                    {item.duration}
                  </span>
                  <span
                    style={{
                      background: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '13px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '10px',
                    }}
                  >
                    {item.difficulty}
                  </span>
                </div>
                <h4 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>{item.name}</h4>
                <p style={{ fontSize: '16px', color: '#64748B', marginTop: '4px' }}>{item.description}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minHeight: '50px', fontSize: '16px', padding: '10px' }}
                  onClick={() => {
                    setSelectedVideoExercise(item);
                    setShowVideoModal(true);
                  }}
                >
                  <Video size={18} />
                  <span>WATCH VIDEO</span>
                </button>

                <button
                  className="btn btn-primary"
                  style={{ flex: 1, minHeight: '50px', fontSize: '16px', padding: '10px' }}
                  onClick={() => onStartExercise(item, prescribed || {
                    id: 'plan',
                    patient_id: user?.id || '1',
                    exercise_id: item.id,
                    target_percentage: item.default_target,
                    hold_seconds: item.default_hold,
                    goal_repetitions: item.default_repetitions
                  })}
                >
                  <Play size={18} fill="#FFFFFF" />
                  <span>START</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showVideoModal && (
        <VideoModal
          exercise={selectedVideoExercise}
          onClose={() => setShowVideoModal(false)}
          onStart={() => onStartExercise(selectedVideoExercise, prescribed || {
            id: 'plan',
            patient_id: user?.id || '1',
            exercise_id: selectedVideoExercise.id,
            target_percentage: selectedVideoExercise.default_target,
            hold_seconds: selectedVideoExercise.default_hold,
            goal_repetitions: selectedVideoExercise.default_repetitions
          })}
        />
      )}
    </div>
  );
};
