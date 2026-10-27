import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Cpu,
  Dumbbell,
  FileSpreadsheet,
  Gauge,
  Heart,
  History,
  Home,
  LogOut,
  Sparkles,
  Stethoscope,
  User,
  Users,
  Video,
} from 'lucide-react';
import React, { useState } from 'react';
import { CaseGeneratorView } from './components/CaseGeneratorView';
import { ClinicianLogView } from './components/ClinicianLogView';
import { DemoControlDock } from './components/DemoControlDock';
import { HistoryWindowCard } from './components/HistoryWindowCard';
import { PatientVideosView } from './components/PatientVideosView';
import { ScenarioLibraryView } from './components/ScenarioLibraryView';
import { WokwiHardwareCard } from './components/WokwiHardwareCard';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  ClinicianLogRow,
  ClinicianPatientSummary,
  WokwiPacket,
} from './types';
import { AuthView } from './views/AuthView';
import { ClinicianDashboardView } from './views/ClinicianDashboardView';
import { ClinicianPatientDetailView } from './views/ClinicianPatientDetailView';
import { ClinicianProfileView } from './views/ClinicianProfileView';
import { PatientProfileView } from './views/PatientProfileView';
import { PatientTrainingSuite } from './views/PatientTrainingSuite';

type AppTab =
  | 'biofeedback'
  | 'scenarios'
  | 'videos'
  | 'generator'
  | 'wokwi'
  | 'clinician_logs'
  | 'patients'
  | 'history'
  | 'profile';

const MainAppContent: React.FC = () => {
  const { user, role, isLoading, switchToPortal, signOut } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>(role === 'clinician' ? 'clinician_logs' : 'biofeedback');
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('typical');

  // Active clinician patient detail
  const [selectedPatient, setSelectedPatient] = useState<ClinicianPatientSummary | null>(null);

  // Shared session attempts for Clinician Log
  const [sessionLogs, setSessionLogs] = useState<ClinicianLogRow[]>([]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E', marginBottom: '16px' }}>
          <Heart size={36} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A' }}>PelviCoach</h2>
        <p style={{ color: '#0F766E', fontWeight: 700 }}>Adaptive Pelvic Floor Biofeedback</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleScenarioSelect = (key: string) => {
    setSelectedScenarioKey(key);
    setActiveTab('generator');
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div
          className="brand-group"
          onClick={() => {
            setSelectedPatient(null);
            setActiveTab(role === 'clinician' ? 'clinician_logs' : 'biofeedback');
          }}
        >
          <div className="brand-icon">
            <Heart size={26} />
          </div>
          <div>
            <div className="brand-title">PelviCoach</div>
            <div className="brand-tagline">Adaptive Pelvic Floor Biofeedback</div>
          </div>
        </div>

        <div className="header-actions">
          {/* Strict Role Switcher: Logs out and prompts for login/signup in the other portal! */}
          <button
            className="role-badge"
            onClick={() => {
              const nextRole = role === 'patient' ? 'clinician' : 'patient';
              switchToPortal(nextRole);
            }}
            title="Log out and switch to the other portal (requires login/signup)"
          >
            {role === 'patient' ? (
              <>
                <span>👩 Logged in as Patient</span>
                <span style={{ fontSize: '11px', background: '#FFFFFF', padding: '2px 8px', borderRadius: '10px', color: '#0F766E', fontWeight: 800 }}>
                  Switch to Clinician (Login) ⇄
                </span>
              </>
            ) : (
              <>
                <span>👨‍⚕️ Logged in as Clinician</span>
                <span style={{ fontSize: '11px', background: '#FFFFFF', padding: '2px 8px', borderRadius: '10px', color: '#4F46E5', fontWeight: 800 }}>
                  Switch to Patient (Login) ⇄
                </span>
              </>
            )}
          </button>

          <button
            onClick={signOut}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs Bar */}
      <nav
        style={{
          background: '#FFFFFF',
          borderBottom: '1.5px solid #E2E8F0',
          padding: '0 24px',
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          position: 'sticky',
          top: '73px',
          zIndex: 40,
        }}
      >
        {/* Clinician-only tab */}
        {role === 'clinician' && (
          <button
            type="button"
            onClick={() => setActiveTab('clinician_logs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '14px 16px',
              border: 'none',
              borderBottom: `3px solid ${activeTab === 'clinician_logs' ? '#4F46E5' : 'transparent'}`,
              background: 'none',
              color: activeTab === 'clinician_logs' ? '#4F46E5' : '#64748B',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FileSpreadsheet size={18} />
            <span>Clinician Logs (Restricted)</span>
          </button>
        )}

        {role === 'clinician' && (
          <button
            type="button"
            onClick={() => {
              setSelectedPatient(null);
              setActiveTab('patients');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '14px 16px',
              border: 'none',
              borderBottom: `3px solid ${activeTab === 'patients' ? '#4F46E5' : 'transparent'}`,
              background: 'none',
              color: activeTab === 'patients' ? '#4F46E5' : '#64748B',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Users size={18} />
            <span>Patients Directory</span>
          </button>
        )}

        {/* Biofeedback & Simulator (Patient Screen alongside Signal Simulator) */}
        <button
          type="button"
          onClick={() => setActiveTab('biofeedback')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '14px 16px',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'biofeedback' ? '#0D9488' : 'transparent'}`,
            background: 'none',
            color: activeTab === 'biofeedback' ? '#0D9488' : '#64748B',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Gauge size={18} />
          <span>Biofeedback & Simulator</span>
        </button>

        {/* Scenario Library (Accessible to Both) */}
        <button
          type="button"
          onClick={() => setActiveTab('scenarios')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '14px 16px',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'scenarios' ? '#0D9488' : 'transparent'}`,
            background: 'none',
            color: activeTab === 'scenarios' ? '#0D9488' : '#64748B',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <BookOpen size={18} />
          <span>Scenario Library</span>
        </button>

        {/* Patient Exercise Videos (Positioned between Scenario Library and Case Generator) */}
        <button
          type="button"
          onClick={() => setActiveTab('videos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '14px 16px',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'videos' ? '#0D9488' : 'transparent'}`,
            background: 'none',
            color: activeTab === 'videos' ? '#0D9488' : '#64748B',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Video size={18} />
          <span>Exercise Videos</span>
        </button>

        {/* Case Generator (Accessible to Both) */}
        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '14px 16px',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'generator' ? '#0D9488' : 'transparent'}`,
            background: 'none',
            color: activeTab === 'generator' ? '#0D9488' : '#64748B',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={18} />
          <span>Case Generator & Replay</span>
        </button>

        {/* Wokwi Hardware Simulation (Dedicated Mode) */}
        <button
          type="button"
          onClick={() => setActiveTab('wokwi')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '14px 16px',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'wokwi' ? '#16A34A' : 'transparent'}`,
            background: 'none',
            color: activeTab === 'wokwi' ? '#16A34A' : '#64748B',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Cpu size={18} />
          <span>Wokwi Hardware Mode</span>
        </button>

        {/* Profile Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '14px 16px',
            border: 'none',
            borderBottom: `3px solid ${activeTab === 'profile' ? '#0D9488' : 'transparent'}`,
            background: 'none',
            color: activeTab === 'profile' ? '#0D9488' : '#64748B',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {role === 'clinician' ? <Stethoscope size={18} /> : <User size={18} />}
          <span>{role === 'clinician' ? 'Practice Profile' : 'Patient Profile'}</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content" style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
        {/* CLINICIAN ONLY LOGS */}
        {activeTab === 'clinician_logs' && (
          <ClinicianLogView logs={sessionLogs} userRole={role} />
        )}

        {/* CLINICIAN PATIENTS DIRECTORY */}
        {activeTab === 'patients' && role === 'clinician' && (
          selectedPatient ? (
            <ClinicianPatientDetailView
              summary={selectedPatient}
              onBack={() => setSelectedPatient(null)}
            />
          ) : (
            <ClinicianDashboardView onSelectPatient={(p) => setSelectedPatient(p)} />
          )
        )}

        {/* BIOFEEDBACK & SIGNAL SIMULATOR (ALONGSIDE) + HISTORY WINDOW */}
        {activeTab === 'biofeedback' && (
          <PatientTrainingSuite
            onSessionCompleteForClinician={(logs) => setSessionLogs(logs)}
          />
        )}

        {/* SCENARIO LIBRARY (ACCESSIBLE TO BOTH) */}
        {activeTab === 'scenarios' && (
          <ScenarioLibraryView onSelectScenario={handleScenarioSelect} />
        )}

        {/* PATIENT EXERCISE VIDEOS */}
        {activeTab === 'videos' && (
          <PatientVideosView onGoToBiofeedback={() => setActiveTab('biofeedback')} />
        )}

        {/* CASE GENERATOR & 3-CHANNEL REPLAY (ACCESSIBLE TO BOTH) */}
        {activeTab === 'generator' && (
          <CaseGeneratorView initialScenarioKey={selectedScenarioKey} />
        )}

        {/* WOKWI HARDWARE SIMULATION (SEPARATE MODE) */}
        {activeTab === 'wokwi' && (
          <WokwiHardwareCard />
        )}

        {/* PROFILE VIEWS */}
        {activeTab === 'profile' && (
          role === 'clinician' ? <ClinicianProfileView /> : <PatientProfileView />
        )}
      </main>

      {/* Presenter Floating Demo Dock */}
      <DemoControlDock />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
