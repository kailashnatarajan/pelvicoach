import React from 'react';

interface CircularTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  phase: 'prepare' | 'contract' | 'relax';
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  totalSeconds,
  remainingSeconds,
  phase,
}) => {
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const getPhaseColor = () => {
    switch (phase) {
      case 'contract':
        return '#0D9488'; // Primary Teal
      case 'relax':
        return '#3B82F6'; // Relax Blue
      case 'prepare':
        return '#D97706'; // Prepare Amber
      default:
        return '#0D9488';
    }
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case 'contract':
        return 'SQUEEZE & HOLD';
      case 'relax':
        return 'RELAX & BREATHE';
      case 'prepare':
        return 'GET READY';
      default:
        return 'HOLD';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 900,
          letterSpacing: '1px',
          color: getPhaseColor(),
          marginBottom: '12px',
          textTransform: 'uppercase',
        }}
      >
        {getPhaseTitle()}
      </div>

      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getPhaseColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.3s ease' }}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '56px', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
            {Math.max(0, remainingSeconds)}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#64748B', letterSpacing: '1px' }}>
            SECONDS
          </span>
        </div>
      </div>
    </div>
  );
};
