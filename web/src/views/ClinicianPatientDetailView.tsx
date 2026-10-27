import { ArrowLeft, Check, CheckCircle2, ChevronLeft, Save } from 'lucide-react';
import React, { useState } from 'react';
import { DEFAULT_EXERCISES } from '../constants/exercises';
import { DatabaseService } from '../services/dbService';
import { ClinicianPatientSummary } from '../types';

interface ClinicianPatientDetailViewProps {
  summary: ClinicianPatientSummary;
  onBack: () => void;
}

export const ClinicianPatientDetailView: React.FC<ClinicianPatientDetailViewProps> = ({
  summary,
  onBack,
}) => {
  const [targetIntensity, setTargetIntensity] = useState(summary.prescription.target_percentage || 65);
  const [holdDuration, setHoldDuration] = useState(summary.prescription.hold_seconds || 5);
  const [goalRepetitions, setGoalRepetitions] = useState(summary.prescription.goal_repetitions || 10);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleSavePlan = async () => {
    setIsSaving(true);
    await DatabaseService.updatePatientExercise(summary.profile.id, DEFAULT_EXERCISES[0].id, {
      target_percentage: targetIntensity,
      hold_seconds: holdDuration,
      goal_repetitions: goalRepetitions,
    });
    setIsSaving(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#0F766E',
          fontSize: '17px',
          fontWeight: 800,
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        <ChevronLeft size={22} />
        <span>Back to Patient List</span>
      </button>

      {/* Patient Overview Header (Section 26) */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>
          PATIENT OVERVIEW
        </span>
        <h1 className="text-hero">{summary.profile.name}</h1>
        <p style={{ fontSize: '16px', color: '#64748B', marginTop: '2px' }}>
          {summary.profile.email} • Code: {summary.profile.patient_code || 'PELVI-4821'}
        </p>
      </div>

      {/* Overview Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>Current Exercise</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
              Pelvic Floor Hold
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>Current Target</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F766E', marginTop: '4px' }}>
              {targetIntensity}% Intensity
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>Goal Repetitions</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
              {goalRepetitions} Repetitions
            </div>
          </div>
        </div>
      </div>

      {/* Section 27: CLINICIAN TRAINING CONTROLS */}
      <h3 className="text-section-title" style={{ marginTop: '32px' }}>
        Prescribed Training Controls
      </h3>

      <div className="card" style={{ padding: '28px' }}>
        <p style={{ fontSize: '15px', color: '#475569', marginBottom: '18px' }}>
          Adjust the patient's biofeedback targets. Saved changes update the patient's mobile app immediately.
        </p>

        {/* Target Intensity Stepper */}
        <div className="stepper-row">
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Target Intensity</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>Activation threshold percentage</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="stepper-btn" onClick={() => setTargetIntensity((p) => Math.max(30, p - 5))}>
              −
            </button>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#0F766E', minWidth: '60px', textAlign: 'center' }}>
              {targetIntensity}%
            </span>
            <button className="stepper-btn" onClick={() => setTargetIntensity((p) => Math.min(95, p + 5))}>
              +
            </button>
          </div>
        </div>

        {/* Hold Duration Stepper */}
        <div className="stepper-row">
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Hold Duration</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>Sustained contraction duration</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="stepper-btn" onClick={() => setHoldDuration((p) => Math.max(2, p - 1))}>
              −
            </button>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', minWidth: '60px', textAlign: 'center' }}>
              {holdDuration}s
            </span>
            <button className="stepper-btn" onClick={() => setHoldDuration((p) => Math.min(20, p + 1))}>
              +
            </button>
          </div>
        </div>

        {/* Goal Repetitions Stepper */}
        <div className="stepper-row" style={{ borderBottom: 'none' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Goal Repetitions</div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>Daily session target repetitions</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="stepper-btn" onClick={() => setGoalRepetitions((p) => Math.max(3, p - 1))}>
              −
            </button>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', minWidth: '60px', textAlign: 'center' }}>
              {goalRepetitions}
            </span>
            <button className="stepper-btn" onClick={() => setGoalRepetitions((p) => Math.min(30, p + 1))}>
              +
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div
            style={{
              background: '#DCFCE7',
              color: '#15803D',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 800,
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={18} />
            <span>Training plan saved successfully to Supabase! Patient app is now updated.</span>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSavePlan} disabled={isSaving} style={{ marginTop: '20px' }}>
          <Save size={20} />
          <span>{isSaving ? 'Saving...' : 'SAVE TRAINING PLAN'}</span>
        </button>
      </div>

      {/* Section 26: Repetition Summary */}
      <h3 className="text-section-title" style={{ marginTop: '32px' }}>
        Repetition Summary
      </h3>
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#DCFCE7', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803D' }}>Successful</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#15803D', marginTop: '4px' }}>
              {summary.successfulReps}
            </div>
          </div>
          <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#B45309' }}>Missed</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#B45309', marginTop: '4px' }}>
              {summary.missedReps}
            </div>
          </div>
          <div style={{ padding: '16px', background: '#FFE4E6', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#DC2626' }}>Compensated</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
              {summary.compensatedReps}
            </div>
          </div>
          <div style={{ padding: '16px', background: '#F1F5F9', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>Invalid</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#64748B', marginTop: '4px' }}>
              {summary.invalidReps}
            </div>
          </div>
        </div>
      </div>

      {/* Section 26: Recent Sessions */}
      <h3 className="text-section-title" style={{ marginTop: '32px' }}>
        Recent Sessions
      </h3>
      {summary.recentSessions.map((s, idx) => (
        <div
          key={s.id || idx}
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
                ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Today'}
            </div>
            <div style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
              Pelvic Floor Hold • {s.total_repetitions} reps ({s.successful_repetitions} OK, {s.compensated_repetitions} Compensated)
            </div>
          </div>
          <div
            style={{
              background: '#DCFCE7',
              color: '#15803D',
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 800,
            }}
          >
            {s.total_repetitions > 0 ? Math.round((s.successful_repetitions / s.total_repetitions) * 100) : 0}% Success
          </div>
        </div>
      ))}
    </div>
  );
};
