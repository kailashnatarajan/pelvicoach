import { CheckCircle2, ChevronDown, ChevronUp, Cpu, Flame, VolumeX, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { demoSimulator } from '../services/demoSimulator';
import { DemoScenario } from '../types';

export const DemoControlDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<DemoScenario>('NORMAL');

  const scenarios: { id: DemoScenario; label: string; icon: any; color: string }[] = [
    { id: 'NORMAL', label: '✓ Correct Exercise', icon: CheckCircle2, color: '#15803D' },
    { id: 'COMPENSATION', label: '⚠ Abdominal Compensation', icon: Flame, color: '#DC2626' },
    { id: 'WEAK', label: '↓ Weak Contraction', icon: ChevronDown, color: '#D97706' },
    { id: 'POOR_SIGNAL', label: '⚠ Poor Sensor Contact', icon: VolumeX, color: '#64748B' },
    { id: 'INTERFERENCE', label: '⚡ Electrical Interference', icon: Zap, color: '#9333EA' },
  ];

  const handleSelect = (scenario: DemoScenario) => {
    setCurrentScenario(scenario);
    demoSimulator.setScenario(scenario);
  };

  return (
    <div className="demo-dock">
      {isOpen && (
        <div className="demo-dock-menu">
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
            🎮 Hackathon Scenarios
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
            Click any scenario to simulate real-time biofeedback:
          </p>

          {scenarios.map((s) => {
            const Icon = s.icon;
            const isSelected = currentScenario === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className={`demo-btn ${isSelected ? 'demo-btn-active' : ''}`}
                style={isSelected ? { background: s.color, borderColor: s.color } : {}}
              >
                <Icon size={18} color={isSelected ? '#FFFFFF' : s.color} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="demo-dock-pill">
        <Cpu size={18} />
        <span>{isOpen ? 'Close Demo Dock' : '🎮 Presenter Controls'}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  );
};
