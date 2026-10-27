import { LogOut, Stethoscope, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';

export const ClinicianProfileView: React.FC = () => {
  const { user, signOut, switchDemoRole } = useAuth();
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      DatabaseService.getClinicianPatients(user.id).then((l) => setPatientCount(l.length));
    }
  }, [user?.id]);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '42px',
            background: '#EEF2FF',
            color: '#4F46E5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}
        >
          <Stethoscope size={44} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A' }}>
          {user?.name || 'Dr. Sarah Jenkins'}
        </h1>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#4F46E5', marginTop: '2px' }}>
          Licensed Pelvic Health Specialist
        </p>
        <p style={{ fontSize: '15px', color: '#64748B' }}>{user?.email}</p>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '16px' }}>
          Practice Overview
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} color="#0F766E" />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Connected Patients</span>
          </div>
          <span style={{ fontSize: '28px', fontWeight: 900, color: '#0F766E' }}>{patientCount}</span>
        </div>
      </div>

      <div
        style={{
          background: '#CCFBF1',
          border: '1.5px solid #99F6E4',
          borderRadius: '20px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F766E', marginBottom: '8px' }}>
          Hackathon Role Switcher:
        </div>
        <button
          onClick={() => switchDemoRole('patient')}
          style={{
            background: '#FFFFFF',
            border: '2px solid #0F766E',
            color: '#0F766E',
            borderRadius: '14px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Switch to 👩 Patient View
        </button>
      </div>

      <MedicalDisclaimer />

      <button className="btn btn-outline" onClick={signOut} style={{ borderColor: '#DC2626', color: '#DC2626' }}>
        <LogOut size={20} />
        <span>LOG OUT</span>
      </button>
    </div>
  );
};
