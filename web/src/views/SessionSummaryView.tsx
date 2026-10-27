import { AlertCircle, CheckCircle2, Cloud, HelpCircle, Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../services/dbService';
import { Attempt, Session } from '../types';

interface SessionSummaryViewProps {
  sessionData: Omit<Session, 'id' | 'created_at'>;
  attempts: Array<Omit<Attempt, 'id' | 'session_id' | 'created_at'>>;
  onDone: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  sessionData,
  attempts,
  onDone,
}) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    DatabaseService.saveSession(sessionData, attempts).then(() => {
      setIsSaved(true);
    });
  }, []);

  return (
    <div style={{ maxWidth: '540px', margin: '20px auto', padding: '0 20px' }}>
      {/* Celebration Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '48px',
            background: '#CCFBF1',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F766E',
            marginBottom: '16px',
          }}
        >
          <Trophy size={54} />
        </div>
        <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
          GREAT WORK! 🎉
        </h1>
        <p style={{ fontSize: '18px', fontWeight: 600, color: '#475569', marginTop: '6px' }}>
          You have successfully completed your session
        </p>
      </div>

      {/* Summary Card (Section 22) */}
      <div className="card" style={{ padding: '32px' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 800,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '6px',
          }}
        >
          TODAY'S SESSION
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>
          Pelvic Floor Exercise
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Successful */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={26} color="#15803D" />
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Successful:</span>
            </div>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#15803D' }}>
              {sessionData.successful_repetitions}
            </span>
          </div>

          {/* Missed */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <HelpCircle size={26} color="#D97706" />
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Missed:</span>
            </div>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#D97706' }}>
              {sessionData.missed_repetitions}
            </span>
          </div>

          {/* Needs Attention */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={26} color="#DC2626" />
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Needs attention:</span>
            </div>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#DC2626' }}>
              {sessionData.compensated_repetitions}
            </span>
          </div>

          <div style={{ height: '2px', background: '#E2E8F0', margin: '4px 0' }} />

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>Total:</span>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#0F766E' }}>
              {sessionData.total_repetitions}
            </span>
          </div>
        </div>

        {/* Sync Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '28px',
            paddingTop: '18px',
            borderTop: '1px solid #E2E8F0',
            color: isSaved ? '#15803D' : '#64748B',
            fontSize: '15px',
            fontWeight: 700,
          }}
        >
          <Cloud size={20} />
          <span>{isSaved ? 'Session saved to Supabase database' : 'Saving session...'}</span>
        </div>
      </div>

      {/* Done Button */}
      <button className="btn btn-primary" onClick={onDone} style={{ marginTop: '16px' }}>
        DONE
      </button>
    </div>
  );
};
