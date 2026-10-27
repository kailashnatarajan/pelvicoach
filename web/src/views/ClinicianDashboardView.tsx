import { ArrowRight, CheckCircle2, ChevronRight, Plus, Search, UserCheck, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { ClinicianPatientSummary } from '../types';

interface ClinicianDashboardViewProps {
  onSelectPatient: (summary: ClinicianPatientSummary) => void;
}

export const ClinicianDashboardView: React.FC<ClinicianDashboardViewProps> = ({ onSelectPatient }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<ClinicianPatientSummary[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCodeInput, setLinkCodeInput] = useState('PELVI-4821');
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadPatients();
  }, [user?.id]);

  const loadPatients = async () => {
    if (!user) return;
    const data = await DatabaseService.getClinicianPatients(user.id);
    setPatients(data);
  };

  const handleLinkPatient = async () => {
    if (!user || !linkCodeInput.trim()) return;
    setLinking(true);
    setLinkMsg(null);

    const res = await DatabaseService.linkPatientByCode(user.id, linkCodeInput);
    setLinking(false);

    if (res.success) {
      setLinkMsg({ text: res.message, isError: false });
      setTimeout(() => {
        setShowLinkModal(false);
        setLinkMsg(null);
        loadPatients();
      }, 1200);
    } else {
      setLinkMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div>
      {/* Header (Section 24 & 25) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>
            CLINICIAN DASHBOARD
          </span>
          <h1 className="text-hero">My Patients</h1>
          <p className="text-subhero">Monitor rehabilitation adherence and tune clinical targets</p>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: 'auto', padding: '14px 24px', minHeight: '52px', fontSize: '16px' }}
          onClick={() => setShowLinkModal(true)}
        >
          <Plus size={20} />
          <span>LINK NEW PATIENT</span>
        </button>
      </div>

      {/* Patient Cards (Section 25) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {patients.map((item) => (
          <div
            key={item.profile.id}
            className="card"
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A' }}>{item.profile.name}</h3>
                  <div style={{ fontSize: '15px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                    Code: {item.profile.patient_code || 'PELVI-4821'}
                  </div>
                </div>

                <div
                  style={{
                    background: '#DCFCE7',
                    color: '#15803D',
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    fontWeight: 800,
                  }}
                >
                  {item.successRate}% Success
                </div>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: 'flex',
                  background: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '16px 12px',
                  justifyContent: 'space-around',
                  margin: '20px 0',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Last Session
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {item.lastSessionDate
                      ? new Date(item.lastSessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : 'Today'}
                  </div>
                </div>

                <div style={{ width: '1px', background: '#E2E8F0' }} />

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Target
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F766E', marginTop: '2px' }}>
                    {item.prescription.target_percentage}%
                  </div>
                </div>

                <div style={{ width: '1px', background: '#E2E8F0' }} />

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Hold / Goal
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {item.prescription.hold_seconds}s / {item.prescription.goal_repetitions}
                  </div>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ minHeight: '52px', fontSize: '17px' }}
              onClick={() => onSelectPatient(item)}
            >
              <span>VIEW PATIENT</span>
              <ArrowRight size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Patient Linking Modal (Section 28) */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A' }}>Connect Patient by Code</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} color="#64748B" />
              </button>
            </div>

            <p style={{ fontSize: '16px', color: '#475569', marginBottom: '20px', lineHeight: 1.5 }}>
              Enter the 6-digit patient link code shown on your patient's PelviCoach app:
            </p>

            {linkMsg && (
              <div
                style={{
                  background: linkMsg.isError ? '#FFE4E6' : '#DCFCE7',
                  color: linkMsg.isError ? '#DC2626' : '#15803D',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  marginBottom: '16px',
                }}
              >
                {linkMsg.text}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Patient Code</label>
              <input
                className="form-input"
                type="text"
                value={linkCodeInput}
                onChange={(e) => setLinkCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. PELVI-4821"
                style={{ fontSize: '26px', fontWeight: 900, textAlign: 'center', letterSpacing: '3px' }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleLinkPatient}
              disabled={linking}
              style={{ marginTop: '16px' }}
            >
              {linking ? 'Linking Patient...' : 'LINK PATIENT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
