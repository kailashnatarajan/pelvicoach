import React from 'react';

interface MuscleActivityGaugeProps {
  pelvicActivity: number;
  abdominalActivity: number;
  targetPercentage: number;
  isCompensating: boolean;
}

export const MuscleActivityGauge: React.FC<MuscleActivityGaugeProps> = ({
  pelvicActivity,
  abdominalActivity,
  targetPercentage,
  isCompensating,
}) => {
  const boundedPelvic = Math.min(100, Math.max(0, pelvicActivity));
  const boundedTarget = Math.min(100, Math.max(0, targetPercentage));
  const reached = boundedPelvic >= boundedTarget;

  const getBarColor = () => {
    if (isCompensating) return '#DC2626'; // Danger Red
    if (reached) return '#15803D'; // Success Green
    return '#D97706'; // Warning Amber
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '24px',
        border: '2px solid #E2E8F0',
        margin: '16px 0',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Your Muscle Activity</span>
        <span style={{ fontSize: '38px', fontWeight: 900, color: getBarColor(), lineHeight: 1 }}>
          {boundedPelvic}%
        </span>
      </div>

      {/* Primary Progress Bar */}
      <div
        style={{
          height: '36px',
          background: '#F1F5F9',
          borderRadius: '18px',
          position: 'relative',
          overflow: 'visible',
          border: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${boundedPelvic}%`,
            background: getBarColor(),
            borderRadius: '18px',
            transition: 'width 0.25s ease-out, background 0.3s ease',
          }}
        />

        {/* Target Marker */}
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            bottom: '-8px',
            left: `${boundedTarget}%`,
            width: '4px',
            background: '#0F172A',
            borderRadius: '2px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-26px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            Target {boundedTarget}%
          </div>
        </div>
      </div>

      {/* Sub indicators */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>
          Minimum Target: {boundedTarget}%
        </span>
        <span
          style={{
            padding: '6px 14px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 800,
            background: isCompensating ? '#FFE4E6' : '#F1F5F9',
            color: isCompensating ? '#DC2626' : '#334155',
            border: `1.5px solid ${isCompensating ? '#FDA4AF' : '#E2E8F0'}`,
          }}
        >
          Stomach Muscles: {isCompensating ? 'Pushing / Compensating ⚠' : 'Relaxed ✓'}
        </span>
      </div>
    </div>
  );
};
