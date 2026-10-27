import { Calendar, CheckCircle2, Flag, Gauge, Ribbon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DEFAULT_EXERCISES } from '../constants/exercises';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { PatientExercise, Session } from '../types';

export const PatientProgressView: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prescribed, setPrescribed] = useState<PatientExercise | null>(null);

  useEffect(() => {
    if (!user) return;
    DatabaseService.getPatientSessions(user.id).then(setSessions);
    DatabaseService.getPatientExercise(user.id, DEFAULT_EXERCISES[0].id).then(setPrescribed);
  }, [user?.id]);

  let totalSuccessful = 0;
  let totalCompensated = 0;
  let totalMissed = 0;

  sessions.forEach((s) => {
    totalSuccessful += s.successful_repetitions;
    totalCompensated += s.compensated_repetitions;
    totalMissed += s.missed_repetitions;
  });

  const currentTarget = prescribed?.target_percentage ?? 65;
  const currentGoal = prescribed?.goal_repetitions ?? 10;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-hero">Your Progress</h1>
        <p className="text-subhero">Celebrate every milestone in your rehabilitation</p>
      </div>

      {/* Large Metric Cards (Section 23) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0F766E' }}>
            <Calendar size={28} />
            <span style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              SESSIONS
            </span>
          </div>
          <div style={{ fontSize: '44px', fontWeight: 900, color: '#0F172A', marginTop: '8px' }}>
            {sessions.length}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#15803D' }}>
            <Ribbon size={28} />
            <span style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              SUCCESSFUL REPETITIONS
            </span>
          </div>
          <div style={{ fontSize: '44px', fontWeight: 900, color: '#15803D', marginTop: '8px' }}>
            {totalSuccessful}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4F46E5' }}>
            <Gauge size={28} />
            <span style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              CURRENT TARGET
            </span>
          </div>
          <div style={{ fontSize: '44px', fontWeight: 900, color: '#4F46E5', marginTop: '8px' }}>
            {currentTarget}%
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D97706' }}>
            <Flag size={28} />
            <span style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              CURRENT GOAL
            </span>
          </div>
          <div style={{ fontSize: '44px', fontWeight: 900, color: '#D97706', marginTop: '8px' }}>
            {currentGoal} reps
          </div>
        </div>
      </div>

      {/* Quality Summary */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
          Contraction Quality Breakdown
        </h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '7px', background: '#15803D' }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
              Successful: {totalSuccessful}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '7px', background: '#DC2626' }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
              Compensated / Attention: {totalCompensated}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '7px', background: '#D97706' }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#334155' }}>
              Missed: {totalMissed}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Sessions List */}
      <h3 className="text-section-title" style={{ marginTop: '32px' }}>
        Session History
      </h3>
      {sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#64748B' }}>No completed sessions yet.</p>
          <p style={{ fontSize: '15px', color: '#94A3B8', marginTop: '4px' }}>
            Complete your first daily exercise to see your session logs here!
          </p>
        </div>
      ) : (
        sessions.slice(0, 5).map((s, i) => (
          <div
            key={s.id || i}
            className="card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                {s.created_at
                  ? new Date(s.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent'}
              </div>
              <div style={{ fontSize: '15px', color: '#64748B', marginTop: '2px' }}>
                {s.total_repetitions} total reps • Pelvic Floor Hold
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#DCFCE7',
                color: '#15803D',
                padding: '8px 16px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={18} />
              <span>{s.successful_repetitions} Good</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
