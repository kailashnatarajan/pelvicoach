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
  difficulty: 'Beginner' | 'Intermediate' | 'Gentle' | 'Advanced';
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
  pelvic_activity: number;    // 0 - 100%
  abdominal_activity: number; // 0 - 100%
  signal_quality: SignalQuality;
  timestamp: number;
}

export type DemoScenario = 
  | 'NORMAL'         // Correct contraction (Pelvic high, Abdominal low)
  | 'COMPENSATION'   // Abdominal compensation (Pelvic high, Abdominal high)
  | 'WEAK'           // Weak contraction (Pelvic < target)
  | 'POOR_SIGNAL'    // Poor sensor contact (Invalid reading)
  | 'INTERFERENCE';  // Electrical noise / interference

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
