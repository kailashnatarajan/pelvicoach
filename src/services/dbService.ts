import AsyncStorage from '@react-native-async-storage/async-storage';
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
  PROFILES: '@pelvicoach_profiles',
  CARE_LINKS: '@pelvicoach_care_links',
  PATIENT_EXERCISES: '@pelvicoach_patient_exercises',
  SESSIONS: '@pelvicoach_sessions',
  ATTEMPTS: '@pelvicoach_attempts',
};

// Default seed patient and clinician for immediate hackathon demonstration out of the box
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
  {
    id: 'mock-session-2',
    patient_id: 'mock-patient-1',
    exercise_id: DEFAULT_EXERCISES[0].id,
    start_time: new Date(Date.now() - 2 * 86400000).toISOString(),
    end_time: new Date(Date.now() - 2 * 86400000 + 290000).toISOString(),
    total_repetitions: 10,
    successful_repetitions: 7,
    missed_repetitions: 2,
    compensated_repetitions: 1,
    invalid_repetitions: 0,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export class DatabaseService {
  // --- PROFILES ---
  static async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) throw error;
        return data as UserProfile;
      } catch (e) {
        console.warn('Live Supabase getProfile failed, fallback to local:', e);
      }
    }

    const profiles = await this.getLocalData<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
    return profiles.find((p) => p.id === userId) || null;
  }

  static async upsertProfile(profile: UserProfile): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('profiles').upsert(profile);
        if (error) throw error;
        return;
      } catch (e) {
        console.warn('Live Supabase upsertProfile failed, fallback to local:', e);
      }
    }

    const profiles = await this.getLocalData<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  }

  // --- EXERCISES ---
  static async getExercises(): Promise<Exercise[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('exercises').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) return data as Exercise[];
      } catch (e) {
        console.warn('Live Supabase getExercises failed, fallback to default:', e);
      }
    }
    return DEFAULT_EXERCISES;
  }

  // --- PATIENT TRAINING PLAN / TARGETS ---
  static async getPatientExercise(patientId: string, exerciseId: string): Promise<PatientExercise> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('patient_exercises')
          .select('*')
          .eq('patient_id', patientId)
          .eq('exercise_id', exerciseId)
          .maybeSingle();

        if (error) throw error;
        if (data) return data as PatientExercise;
      } catch (e) {
        console.warn('Live Supabase getPatientExercise failed, fallback to local:', e);
      }
    }

    const plans = await this.getLocalData<PatientExercise>(STORAGE_KEYS.PATIENT_EXERCISES, DEFAULT_MOCK_PRESCRIBED);
    const found = plans.find((p) => p.patient_id === patientId && p.exercise_id === exerciseId);
    if (found) return found;

    // Fallback default
    const fallback: PatientExercise = {
      id: `plan-${patientId}-${exerciseId}`,
      patient_id: patientId,
      exercise_id: exerciseId,
      target_percentage: 65,
      hold_seconds: 5,
      goal_repetitions: 10,
      updated_at: new Date().toISOString(),
    };
    return fallback;
  }

  static async updatePatientExercise(
    patientId: string,
    exerciseId: string,
    updates: Partial<Pick<PatientExercise, 'target_percentage' | 'hold_seconds' | 'goal_repetitions'>>
  ): Promise<PatientExercise> {
    const updatedPayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('patient_exercises')
          .upsert({
            patient_id: patientId,
            exercise_id: exerciseId,
            ...updatedPayload,
          }, { onConflict: 'patient_id,exercise_id' })
          .select()
          .single();

        if (error) throw error;
        return data as PatientExercise;
      } catch (e) {
        console.warn('Live Supabase updatePatientExercise failed, fallback to local:', e);
      }
    }

    const plans = await this.getLocalData<PatientExercise>(STORAGE_KEYS.PATIENT_EXERCISES, DEFAULT_MOCK_PRESCRIBED);
    const existingIndex = plans.findIndex((p) => p.patient_id === patientId && p.exercise_id === exerciseId);
    let updatedPlan: PatientExercise;

    if (existingIndex >= 0) {
      updatedPlan = { ...plans[existingIndex], ...updatedPayload };
      plans[existingIndex] = updatedPlan;
    } else {
      updatedPlan = {
        id: `plan-${Date.now()}`,
        patient_id: patientId,
        exercise_id: exerciseId,
        target_percentage: updates.target_percentage ?? 65,
        hold_seconds: updates.hold_seconds ?? 5,
        goal_repetitions: updates.goal_repetitions ?? 10,
        updated_at: new Date().toISOString(),
      };
      plans.push(updatedPlan);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_EXERCISES, JSON.stringify(plans));
    return updatedPlan;
  }

  // --- SESSIONS & ATTEMPTS ---
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
        const { data: insertedSession, error: sErr } = await supabase
          .from('sessions')
          .insert({
            patient_id: sessionData.patient_id,
            exercise_id: sessionData.exercise_id,
            start_time: sessionData.start_time,
            end_time: sessionData.end_time,
            total_repetitions: sessionData.total_repetitions,
            successful_repetitions: sessionData.successful_repetitions,
            missed_repetitions: sessionData.missed_repetitions,
            compensated_repetitions: sessionData.compensated_repetitions,
            invalid_repetitions: sessionData.invalid_repetitions,
          })
          .select()
          .single();

        if (sErr) throw sErr;

        if (attempts.length > 0 && insertedSession) {
          const formattedAttempts = attempts.map((att) => ({
            session_id: insertedSession.id,
            rep_number: att.rep_number,
            result: att.result,
            target_percentage: att.target_percentage,
            pelvic_activity: att.pelvic_activity,
            abdominal_activity: att.abdominal_activity,
            hold_seconds: att.hold_seconds,
            feedback: att.feedback,
          }));

          const { error: aErr } = await supabase.from('attempts').insert(formattedAttempts);
          if (aErr) console.warn('Error saving attempts to Supabase:', aErr);
        }

        return insertedSession as Session;
      } catch (e) {
        console.warn('Live Supabase saveSession failed, fallback to local:', e);
      }
    }

    // Local Storage save
    const sessions = await this.getLocalData<Session>(STORAGE_KEYS.SESSIONS, DEFAULT_MOCK_SESSIONS);
    sessions.unshift(newSession);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    const allAttempts = await this.getLocalData<Attempt>(STORAGE_KEYS.ATTEMPTS, []);
    const newAttempts: Attempt[] = attempts.map((a, i) => ({
      ...a,
      id: `att-${sessionId}-${i}`,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([...allAttempts, ...newAttempts]));

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

        if (error) throw error;
        if (data) return data as Session[];
      } catch (e) {
        console.warn('Live Supabase getPatientSessions failed, fallback to local:', e);
      }
    }

    const sessions = await this.getLocalData<Session>(STORAGE_KEYS.SESSIONS, DEFAULT_MOCK_SESSIONS);
    return sessions.filter((s) => s.patient_id === patientId);
  }

  // --- CLINICIAN PATIENT LIST & DETAILS ---
  static async getClinicianPatients(clinicianId: string): Promise<ClinicianPatientSummary[]> {
    let linkedPatientProfiles: UserProfile[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data: links, error: lErr } = await supabase
          .from('care_links')
          .select('patient_id')
          .eq('clinician_id', clinicianId);

        if (lErr) throw lErr;

        if (links && links.length > 0) {
          const patientIds = links.map((l) => l.patient_id);
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .in('id', patientIds);

          if (pErr) throw pErr;
          if (profiles) linkedPatientProfiles = profiles as UserProfile[];
        }
      } catch (e) {
        console.warn('Live Supabase getClinicianPatients failed, fallback to local:', e);
      }
    }

    if (linkedPatientProfiles.length === 0) {
      // Use local data
      const links = await this.getLocalData<{ patient_id: string; clinician_id: string }>(
        STORAGE_KEYS.CARE_LINKS,
        DEFAULT_MOCK_LINKS
      );
      const patientIds = links.filter((l) => l.clinician_id === clinicianId).map((l) => l.patient_id);
      const allProfiles = await this.getLocalData<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
      linkedPatientProfiles = allProfiles.filter((p) => patientIds.includes(p.id) && p.role === 'patient');
    }

    const summaries: ClinicianPatientSummary[] = [];

    for (const patient of linkedPatientProfiles) {
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
      const lastSessionDate = sessions.length > 0 ? sessions[0].created_at : undefined;

      summaries.push({
        profile: patient,
        prescription,
        lastSessionDate,
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

  // --- PATIENT-CLINICIAN LINKING ---
  static async linkPatientByCode(
    clinicianId: string,
    patientCode: string
  ): Promise<{ success: boolean; message: string; patient?: UserProfile }> {
    const formattedCode = patientCode.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('link_patient_by_code', {
          p_code: formattedCode,
        });

        if (error) throw error;
        if (data && data.success) {
          return { success: true, message: data.message };
        } else if (data) {
          return { success: false, message: data.message };
        }
      } catch (e) {
        console.warn('Live Supabase link_patient_by_code RPC failed, fallback to local:', e);
      }
    }

    // Local linking
    const profiles = await this.getLocalData<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
    const targetPatient = profiles.find(
      (p) => p.role === 'patient' && p.patient_code?.toUpperCase() === formattedCode
    );

    if (!targetPatient) {
      return { success: false, message: `Patient code "${formattedCode}" not found.` };
    }

    const links = await this.getLocalData<{ id: string; patient_id: string; clinician_id: string }>(
      STORAGE_KEYS.CARE_LINKS,
      DEFAULT_MOCK_LINKS
    );

    const alreadyLinked = links.some(
      (l) => l.patient_id === targetPatient.id && l.clinician_id === clinicianId
    );

    if (alreadyLinked) {
      return { success: true, message: `${targetPatient.name} is already linked.`, patient: targetPatient };
    }

    links.push({
      id: `link-${Date.now()}`,
      patient_id: targetPatient.id,
      clinician_id: clinicianId,
    });
    await AsyncStorage.setItem(STORAGE_KEYS.CARE_LINKS, JSON.stringify(links));

    return {
      success: true,
      message: `Successfully linked ${targetPatient.name}!`,
      patient: targetPatient,
    };
  }

  static async getConnectedClinician(patientId: string): Promise<UserProfile | null> {
    const links = await this.getLocalData<{ patient_id: string; clinician_id: string }>(
      STORAGE_KEYS.CARE_LINKS,
      DEFAULT_MOCK_LINKS
    );
    const link = links.find((l) => l.patient_id === patientId);
    if (!link) return null;

    const profiles = await this.getLocalData<UserProfile>(STORAGE_KEYS.PROFILES, DEFAULT_MOCK_PROFILES);
    return profiles.find((p) => p.id === link.clinician_id) || null;
  }

  private static async getLocalData<T>(key: string, defaultVal: T[]): Promise<T[]> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T[];
      }
      await AsyncStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    } catch {
      return defaultVal;
    }
  }
}
