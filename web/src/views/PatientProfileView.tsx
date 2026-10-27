import { Copy, HeartHandshake, LogOut, ShieldCheck, User } from 'lucide-react';
import React, { useState } from 'react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';

export const PatientProfileView: React.FC = () => {
  const { user, signOut, switchDemoRole } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(user?.patient_code || 'PELVI-4821');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '42px',
            background: '#CCFBF1',
            color: '#0F766E',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          <User size={44} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A' }}>
          {user?.name || 'Lakshmi Devi'}
        </h1>
        <p style={{ fontSize: '16px', color: '#64748B' }}>{user?.email}</p>
      </div>

      {/* Patient Connection Code Card (Section 28) */}
      <div
        className="card"
        style={{
          background: '#F0FDFA',
          borderColor: '#99F6E4',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#0F766E',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '6px',
          }}
        >
          YOUR PATIENT LINK CODE
        </div>
        <p style={{ fontSize: '15px', color: '#334155', marginBottom: '14px' }}>
          Provide this code to your doctor or clinician so they can link your profile:
        </p>

        <div
          onClick={handleCopy}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '2px solid #0D9488',
            borderRadius: '16px',
            padding: '16px 24px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '30px', fontWeight: 900, color: '#0F766E', letterSpacing: '3px' }}>
            {user?.patient_code || 'PELVI-4821'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F766E', fontWeight: 700 }}>
            <Copy size={20} />
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </div>
        </div>
      </div>

      {/* Care Details */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
          Clinical Care Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Connected Clinician</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              Dr. Sarah Jenkins (Pelvic Health Clinic)
            </div>
          </div>
          <div style={{ height: '1px', background: '#F1F5F9' }} />
          <div>
            <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Primary Training Goal</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              Pelvic Floor Muscle Strengthening & Biofeedback
            </div>
          </div>
          <div style={{ height: '1px', background: '#F1F5F9' }} />
          <div>
            <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Prescription Status</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803D', marginTop: '2px' }}>
              Active Patient Plan
            </div>
          </div>
        </div>
      </div>

      {/* Presenter Role Switcher */}
      <div
        style={{
          background: '#EEF2FF',
          border: '1.5px solid #C7D2FE',
          borderRadius: '20px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#3730A3', marginBottom: '8px' }}>
          Hackathon Role Switcher:
        </div>
        <button
          onClick={() => switchDemoRole('clinician')}
          style={{
            background: '#FFFFFF',
            border: '2px solid #4F46E5',
            color: '#4F46E5',
            borderRadius: '14px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Switch to 👨‍⚕️ Clinician View
        </button>
      </div>

      {/* Medical Disclaimer (Section 35) */}
      <MedicalDisclaimer />

      {/* Log Out */}
      <button
        className="btn btn-outline"
        onClick={signOut}
        style={{ borderColor: '#DC2626', color: '#DC2626', marginTop: '10px' }}
      >
        <LogOut size={20} />
        <span>LOG OUT</span>
      </button>
    </div>
  );
};
