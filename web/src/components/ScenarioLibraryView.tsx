import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { generateScenarioCase, SCENARIOS, ScenarioDefinition } from '../services/caseGenerator';

export interface ScenarioLibraryProps {
  onSelectScenario: (scenarioKey: string) => void;
}

export const ScenarioLibraryView: React.FC<ScenarioLibraryProps> = ({ onSelectScenario }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Render SVG sparkline for preview
  const renderSparkline = (key: string) => {
    try {
      const res = generateScenarioCase(key, 11);
      if (!res.ok || !res.session) return null;
      const env = res.session.envelope;
      const step = Math.max(1, Math.floor(env.length / 150));
      let mx = 0;
      for (let i = 0; i < env.length; i++) if (env[i] > mx) mx = env[i];
      mx = mx * 1.05 || 1;

      const pts: string[] = [];
      for (let i = 0; i < env.length; i += step) {
        const x = ((i / env.length) * 300).toFixed(1);
        const y = (46 - (env[i] / mx) * 42).toFixed(1);
        pts.push(`${x},${y}`);
      }

      return (
        <div style={{ height: '50px', background: '#F1F5F9', borderRadius: '8px', padding: '2px', margin: '10px 0' }}>
          <svg viewBox="0 0 300 50" style={{ width: '100%', height: '100%', display: 'block' }}>
            <polyline points={pts.join(' ')} fill="none" stroke="#0D9488" strokeWidth="1.8" />
          </svg>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Intro Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: '#CCFBF1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E',
            }}
          >
            <BookOpen size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A' }}>Clinical Scenario Library</h2>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              Seven named physiological patterns for education, verification, and algorithm stress-testing.
            </p>
          </div>
        </div>
        <div
          style={{
            background: '#F8FAFC',
            borderLeft: '4px solid #0D9488',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#334155',
            marginTop: '8px',
          }}
        >
          Each scenario defines an expected neuromuscular signal signature, differential clinical explanations, and multi-sensor validation rules. All previews use fixed seed 11 for clinical consistency.
        </div>
      </div>

      {/* Grid of 7 Scenario Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {SCENARIOS.map((sc) => {
          const isExpanded = expandedId === sc.id;
          return (
            <div
              key={sc.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1.5px solid #E2E8F0',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      background: '#CCFBF1',
                      color: '#0F766E',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {sc.id}
                  </span>
                  <span
                    style={{
                      background: sc.quality === 'Good' ? '#DCFCE7' : '#FEF3C7',
                      color: sc.quality === 'Good' ? '#15803D' : '#B45309',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {sc.quality}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginTop: '10px' }}>
                  {sc.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic', margin: '4px 0 8px' }}>
                  “{sc.question}”
                </p>

                {/* Envelope Sparkline */}
                {renderSparkline(sc.key)}

                <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.45, marginBottom: '12px' }}>
                  {sc.pattern}
                </p>

                {/* Tag Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {sc.extra.map((chip, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                {/* Full definition dropdown */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : sc.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0D9488',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                    marginBottom: '14px',
                  }}
                >
                  {isExpanded ? 'Hide clinical parameters' : 'Show full clinical parameters'}
                  <ChevronDown
                    size={14}
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                  />
                </button>

                {isExpanded && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#475569',
                      marginBottom: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <b style={{ color: '#0F172A' }}>Expected Signal:</b>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                        {sc.signal.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <b style={{ color: '#0F172A' }}>Differential Considerations:</b>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                        {sc.alt.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectScenario(sc.key)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Generate This Case</span>
                <ArrowRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
