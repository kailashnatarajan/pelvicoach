export type UserRole = 'patient' | 'clinician';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  patient_code?: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string;
  video_url?: string;
  video_filename?: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Gentle';
  default_target: number;
  default_hold: number;
  default_repetitions: number;
}

export interface PatientExercise {
  id: string;
  patient_id: string;
  exercise_id: string;
  target_percentage: number;
  hold_seconds: number;
  goal_repetitions: number;
  updated_at?: string;
}

export type RepetitionResult = 'OK' | 'MISS' | 'COMPENSATED' | 'INVALID';

export interface Session {
  id: string;
  patient_id: string;
  exercise_id: string;
  start_time: string;
  end_time: string;
  total_repetitions: number;
  successful_repetitions: number;
  missed_repetitions: number;
  compensated_repetitions: number;
  invalid_repetitions: number;
  created_at?: string;
}

export interface Attempt {
  id: string;
  session_id: string;
  rep_number: number;
  result: RepetitionResult;
  target_percentage: number;
  pelvic_activity: number;
  abdominal_activity: number;
  hold_seconds: number;
  feedback: string;
  created_at?: string;
}

export type SignalQuality = 'GOOD' | 'POOR' | 'NOISY';

export interface BiofeedbackReading {
  pelvic_activity: number;
  abdominal_activity: number;
  signal_quality: SignalQuality;
  timestamp: number;
}

export type DemoScenario =
  | 'NORMAL'
  | 'COMPENSATION'
  | 'WEAK'
  | 'POOR_SIGNAL'
  | 'INTERFERENCE';

export interface ClinicianPatientSummary {
  profile: UserProfile;
  prescription: PatientExercise;
  lastSessionDate?: string;
  successRate: number;
  totalSessions: number;
  totalReps: number;
  successfulReps: number;
  missedReps: number;
  compensatedReps: number;
  invalidReps: number;
  recentSessions: Session[];
}

export interface ClinicianLogRow {
  n: number;
  res: RepetitionResult;
  tgt: number;
  hold: number;
  avg: number;
  why: string;
  nv: string;
  fc: boolean;
  timestamp?: string;
}

export interface HistorySessionRecord {
  id: string;
  timestamp: string;
  durationSeconds: number;
  totalAttempts: number;
  goodReps: number;
  targetPercentage: number;
  holdSeconds: number;
  accuracyRate: number;
  adaptiveChange?: string;
  log: ClinicianLogRow[];
}

export interface WokwiPacket {
  pf: number;
  ab: number;
  mr: number;
  ts?: number;
}

