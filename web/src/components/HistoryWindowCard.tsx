import { Award, Calendar, CheckCircle2, ChevronRight, History, Sparkles, TrendingUp, Zap } from 'lucide-react';
import React from 'react';
import { HistorySessionRecord } from '../types';

export interface HistoryWindowProps {
  sessions: HistorySessionRecord[];
  currentAdaptiveTarget: number;
  currentAdaptiveHold: number;
  streak: number;
  onClearHistory?: () => void;
}

export const HistoryWindowCard: React.FC<HistoryWindowProps> = ({
  sessions,
  currentAdaptiveTarget,
  currentAdaptiveHold,
  streak,
  onClearHistory,
}) => {
  const totalCompleted = sessions.length;
  const avgAccuracy =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.accuracyRate, 0) / sessions.length)
      : 88;

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '19px',
              background: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803D',
            }}
          >
            <History size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>Session History & Adaptive Target</h3>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
              Performance-driven flexible progression based on past exercises
            </p>
          </div>
        </div>

        {onClearHistory && sessions.length > 0 && (
          <button
            onClick={onClearHistory}
            style={{
              background: 'none',
              border: '1px solid #CBD5E1',
              color: '#64748B',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Clear History
          </button>
        )}
      </div>

      {/* ADAPTIVE TARGET STATUS BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '18px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 14px rgba(15, 118, 110, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
              <TrendingUp size={16} />
              Flexible Adaptive Target
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, marginTop: '2px' }}>
              Target: {currentAdaptiveTarget}% · Hold: {currentAdaptiveHold}s
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', display: 'block', opacity: 0.85 }}>Consecutive Streak</span>
            <b style={{ fontSize: '18px' }}>🔥 {streak} in a row</b>
          </div>
        </div>

        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>✨ <b>+5% target</b> after 3 good reps</span>
          <span>🛡️ <b>-5% relief</b> after 2 fatigued/compensated attempts</span>
          <span>📈 <b>Automatically personalized</b> for your next session</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Total Sessions</span>
          <b style={{ fontSize: '22px', color: '#0F172A' }}>{totalCompleted}</b>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Avg Accuracy</span>
          <b style={{ fontSize: '22px', color: '#15803D' }}>{avgAccuracy}%</b>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Next Starting Target</span>
          <b style={{ fontSize: '22px', color: '#0D9488' }}>{currentAdaptiveTarget}%</b>
        </div>
      </div>

      {/* Sessions Timeline Table */}
      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
        Past Exercise Records ({sessions.length})
      </h4>

      {sessions.length === 0 ? (
        <div
          style={{
            padding: '30px',
            textAlign: 'center',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1.5px dashed #CBD5E1',
            color: '#64748B',
          }}
        >
          <History size={36} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 700, fontSize: '15px', color: '#475569' }}>No sessions logged yet.</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Complete a calibration and start your first 8-rep workout above to build your performance history!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.map((ses, idx) => (
            <div
              key={ses.id || idx}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px',
                background: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="#64748B" />
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                    {ses.timestamp}
                  </span>
                  <span
                    style={{
                      background: '#DCFCE7',
                      color: '#15803D',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {ses.goodReps} / {ses.totalAttempts} Reps OK
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                  Target: {ses.targetPercentage}% · Hold: {ses.holdSeconds}s · Accuracy: {ses.accuracyRate}%
                </div>
                {ses.adaptiveChange && (
                  <div style={{ fontSize: '12px', color: '#0D9488', fontWeight: 700, marginTop: '2px' }}>
                    💡 {ses.adaptiveChange}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '15px',
                    fontWeight: 900,
                    color: ses.accuracyRate >= 80 ? '#15803D' : '#D97706',
                  }}
                >
                  <Award size={18} />
                  {ses.accuracyRate}% Score
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
