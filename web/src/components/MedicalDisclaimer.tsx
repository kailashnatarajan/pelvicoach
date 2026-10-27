import { Info } from 'lucide-react';
import React from 'react';

export const MedicalDisclaimer: React.FC = () => {
  return (
    <div
      style={{
        background: '#F1F5F9',
        border: '1.5px solid #CBD5E1',
        borderRadius: '18px',
        padding: '16px 20px',
        margin: '24px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <Info size={18} color="#475569" />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Research & Clinical Disclaimer
        </span>
      </div>
      <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
        PelviCoach is a prototype developed for demonstration and research purposes. It is not a
        clinically validated diagnostic or treatment device. Clinical use requires appropriate
        validation and qualified healthcare supervision.
      </p>
    </div>
  );
};
