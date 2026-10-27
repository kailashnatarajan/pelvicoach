import { DEFAULT_EXERCISES } from '../constants/exercises';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  Attempt,
  ClinicianPatientSummary,
  Exercise,
  PatientExercise,
  Session,
  UserProfile,
} from '../types';

const STORAGE_KEYS = {
  PROFILES: 'pelvicoach_profiles',
  CARE_LINKS: 'pelvicoach_care_links',
  PATIENT_EXERCISES: 'pelvicoach_patient_exercises',
  SESSIONS: 'pelvicoach_sessions',
  ATTEMPTS: 'pelvicoach_attempts',
};

const DEFAULT_MOCK_PROFILES: UserProfile[] = [
  {
    id: 'mock-patient-1',
    name: 'Lakshmi Devi',
    email: 'lakshmi@example.com',
    role: 'patient',
    patient_code: 'PELVI-4821',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'mock-clinician-1',
    name: 'Dr. Sarah Jenkins',
    email: 'dr.jenkins@clinic.com',
    role: 'clinician',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const DEFAULT_MOCK_LINKS = [
  {
    id: 'mock-link-1',
    patient_id: 'mock-patient-1',
    clinician_id: 'mock-clinician-1',
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_MOCK_PRESCRIBED: PatientExercise[] = [
  {
    id: 'mock-presc-1',
    patient_id: 'mock-patient-1',
    exercise_id: DEFAULT_EXERCISES[0].id,
    target_percentage: 65,
    hold_seconds: 5,
    goal_repetitions: 10,
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_MOCK_SESSIONS: Session[] = [
  {
    id: 'mock-session-1',
    patient_id: 'mock-patient-1',
    exercise_id: DEFAULT_EXERCISES[0].id,
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() - 86400000 + 300000).toISOString(),
    total_repetitions: 10,
    successful_repetitions: 8,
    missed_repetitions: 1,
    compensated_repetitions: 1,
    invalid_repetitions: 0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export class DatabaseService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!error && data) return data as UserProfile;
      } catch (e) {
        console.warn('Live Supabase getProfile fallback:', e);
      }
    }
    const profiles = this.getLocal<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
    return profiles.find((p) => p.id === userId) || null;
  }

  static async upsertProfile(profile: UserProfile): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').upsert(profile);
      } catch (e) {
        console.warn('Live Supabase upsertProfile fallback:', e);
      }
    }
    const profiles = this.getLocal<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push(profile);
    this.setLocal(STORAGE_KEYS.PROFILES, profiles);
  }

  static async getExercises(): Promise<Exercise[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('exercises').select('*');
        if (!error && data && data.length > 0) return data as Exercise[];
      } catch (e) {
        console.warn('Live Supabase getExercises fallback:', e);
      }
    }
    return DEFAULT_EXERCISES;
  }

  static async getPatientExercise(patientId: string, exerciseId: string): Promise<PatientExercise> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('patient_exercises')
          .select('*')
          .eq('patient_id', patientId)
          .eq('exercise_id', exerciseId)
          .maybeSingle();
        if (!error && data) return data as PatientExercise;
      } catch (e) {
        console.warn('Live Supabase getPatientExercise fallback:', e);
      }
    }
    const plans = this.getLocal<PatientExercise>(STORAGE_KEYS.PATIENT_EXERCISES, DEFAULT_MOCK_PRESCRIBED);
    const found = plans.find((p) => p.patient_id === patientId && p.exercise_id === exerciseId);
    if (found) return found;

    return {
      id: `plan-${patientId}`,
      patient_id: patientId,
      exercise_id: exerciseId,
      target_percentage: 65,
      hold_seconds: 5,
      goal_repetitions: 10,
      updated_at: new Date().toISOString(),
    };
  }

  static async updatePatientExercise(
    patientId: string,
    exerciseId: string,
    updates: Partial<Pick<PatientExercise, 'target_percentage' | 'hold_seconds' | 'goal_repetitions'>>
  ): Promise<PatientExercise> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('patient_exercises')
          .upsert(
            {
              patient_id: patientId,
              exercise_id: exerciseId,
              ...payload,
            },
            { onConflict: 'patient_id,exercise_id' }
          )
          .select()
          .single();
        if (!error && data) return data as PatientExercise;
      } catch (e) {
        console.warn('Live Supabase updatePatientExercise fallback:', e);
      }
    }

    const plans = this.getLocal<PatientExercise>(STORAGE_KEYS.PATIENT_EXERCISES, DEFAULT_MOCK_PRESCRIBED);
    const idx = plans.findIndex((p) => p.patient_id === patientId && p.exercise_id === exerciseId);
    let updated: PatientExercise;
    if (idx >= 0) {
      updated = { ...plans[idx], ...payload };
      plans[idx] = updated;
    } else {
      updated = {
        id: `plan-${Date.now()}`,
        patient_id: patientId,
        exercise_id: exerciseId,
        target_percentage: updates.target_percentage ?? 65,
        hold_seconds: updates.hold_seconds ?? 5,
        goal_repetitions: updates.goal_repetitions ?? 10,
        updated_at: new Date().toISOString(),
      };
      plans.push(updated);
    }
    this.setLocal(STORAGE_KEYS.PATIENT_EXERCISES, plans);
    return updated;
  }

  static async saveSession(
    sessionData: Omit<Session, 'id' | 'created_at'>,
    attempts: Array<Omit<Attempt, 'id' | 'session_id' | 'created_at'>>
  ): Promise<Session> {
    const sessionId = `sess-${Date.now()}`;
    const newSession: Session = {
      ...sessionData,
      id: sessionId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select()
          .single();

        if (!error && inserted) {
          if (attempts.length > 0) {
            const formatted = attempts.map((a) => ({
              session_id: inserted.id,
              ...a,
            }));
            await supabase.from('attempts').insert(formatted);
          }
          return inserted as Session;
        }
      } catch (e) {
        console.warn('Live Supabase saveSession fallback:', e);
      }
    }

    const sessions = this.getLocal<Session>(STORAGE_KEYS.SESSIONS, DEFAULT_MOCK_SESSIONS);
    sessions.unshift(newSession);
    this.setLocal(STORAGE_KEYS.SESSIONS, sessions);

    const prevAttempts = this.getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS, []);
    const newAttempts: Attempt[] = attempts.map((a, i) => ({
      ...a,
      id: `att-${sessionId}-${i}`,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    }));
    this.setLocal(STORAGE_KEYS.ATTEMPTS, [...prevAttempts, ...newAttempts]);

    return newSession;
  }

  static async getPatientSessions(patientId: string): Promise<Session[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as Session[];
      } catch (e) {
        console.warn('Live Supabase getPatientSessions fallback:', e);
      }
    }
    const sessions = this.getLocal<Session>(STORAGE_KEYS.SESSIONS, DEFAULT_MOCK_SESSIONS);
    return sessions.filter((s) => s.patient_id === patientId);
  }

  static async getClinicianPatients(clinicianId: string): Promise<ClinicianPatientSummary[]> {
    let linkedProfiles: UserProfile[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data: links } = await supabase
          .from('care_links')
          .select('patient_id')
          .eq('clinician_id', clinicianId);
        if (links && links.length > 0) {
          const ids = links.map((l) => l.patient_id);
          const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
          if (profs) linkedProfiles = profs as UserProfile[];
        }
      } catch (e) {
        console.warn('Live Supabase getClinicianPatients fallback:', e);
      }
    }

    if (linkedProfiles.length === 0) {
      const links = this.getLocal<{ patient_id: string; clinician_id: string }>(
        STORAGE_KEYS.CARE_LINKS,
        DEFAULT_MOCK_LINKS
      );
      const ids = links.filter((l) => l.clinician_id === clinicianId).map((l) => l.patient_id);
      const all = this.getLocal<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
      linkedProfiles = all.filter((p) => ids.includes(p.id) && p.role === 'patient');
    }

    const summaries: ClinicianPatientSummary[] = [];
    for (const patient of linkedProfiles) {
      const sessions = await this.getPatientSessions(patient.id);
      const prescription = await this.getPatientExercise(patient.id, DEFAULT_EXERCISES[0].id);

      let totalReps = 0;
      let successfulReps = 0;
      let missedReps = 0;
      let compensatedReps = 0;
      let invalidReps = 0;

      sessions.forEach((s) => {
        totalReps += s.total_repetitions;
        successfulReps += s.successful_repetitions;
        missedReps += s.missed_repetitions;
        compensatedReps += s.compensated_repetitions;
        invalidReps += s.invalid_repetitions;
      });

      const successRate = totalReps > 0 ? Math.round((successfulReps / totalReps) * 100) : 0;
      summaries.push({
        profile: patient,
        prescription,
        lastSessionDate: sessions[0]?.created_at,
        successRate,
        totalSessions: sessions.length,
        totalReps,
        successfulReps,
        missedReps,
        compensatedReps,
        invalidReps,
        recentSessions: sessions.slice(0, 5),
      });
    }

    return summaries;
  }

  static async linkPatientByCode(
    clinicianId: string,
    code: string
  ): Promise<{ success: boolean; message: string; patient?: UserProfile }> {
    const formatted = code.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('link_patient_by_code', { p_code: formatted });
        if (!error && data) {
          return { success: data.success, message: data.message };
        }
      } catch (e) {
        console.warn('Live Supabase link_patient_by_code fallback:', e);
      }
    }

    const profiles = this.getLocal<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
    const target = profiles.find((p) => p.role === 'patient' && p.patient_code?.toUpperCase() === formatted);
    if (!target) {
      return { success: false, message: `Patient code "${formatted}" not found.` };
    }

    const links = this.getLocal<{ id: string; patient_id: string; clinician_id: string }>(
      STORAGE_KEYS.CARE_LINKS,
      DEFAULT_MOCK_LINKS
    );
    if (links.some((l) => l.patient_id === target.id && l.clinician_id === clinicianId)) {
      return { success: true, message: `${target.name} is already linked.`, patient: target };
    }

    links.push({ id: `link-${Date.now()}`, patient_id: target.id, clinician_id: clinicianId });
    this.setLocal(STORAGE_KEYS.CARE_LINKS, links);
    return { success: true, message: `Successfully linked ${target.name}!`, patient: target };
  }

  private static getLocal<T>(key: string, defaultVal: T[]): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private static setLocal(key: string, val: any) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('localStorage set error', e);
    }
  }
}
