import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DatabaseService } from '../services/dbService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  targetPortal: UserRole;
  setTargetPortal: (role: UserRole) => void;
  signIn: (email: string, pass: string, preferredRole?: UserRole) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, pass: string, role: UserRole) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchToPortal: (targetRole: UserRole) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const CURRENT_USER_KEY = 'pelvicoach_current_user';
const TARGET_PORTAL_KEY = 'pelvicoach_target_portal';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [targetPortal, setTargetPortalState] = useState<UserRole>(() => {
    return (localStorage.getItem(TARGET_PORTAL_KEY) as UserRole) || 'patient';
  });

  const setTargetPortal = (r: UserRole) => {
    setTargetPortalState(r);
    localStorage.setItem(TARGET_PORTAL_KEY, r);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      if (isSupabaseConfigured) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await DatabaseService.getProfile(session.user.id);
          if (profile) {
            setUser(profile);
            setRole(profile.role);
            setTargetPortal(profile.role);
            setIsLoading(false);
            return;
          }
        }
      }

      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        setUser(parsed);
        setRole(parsed.role);
        setTargetPortal(parsed.role);
      } else {
        // No auto-login: user must explicitly log in or sign up!
        setUser(null);
        setRole(null);
      }
    } catch (e) {
      console.warn('Session check error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, pass: string, preferredRole?: UserRole): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: pass,
        });

        if (!error && data.user) {
          const profile = await DatabaseService.getProfile(data.user.id);
          if (profile) {
            setUser(profile);
            setRole(profile.role);
            setTargetPortal(profile.role);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
            setIsLoading(false);
            return {};
          }
        }
      }

      let profile = await DatabaseService.getProfile(`user-${trimmedEmail}`);
      if (!profile) {
        const chosenRole: UserRole =
          preferredRole ||
          (trimmedEmail.includes('clinician') || trimmedEmail.includes('dr') ? 'clinician' : 'patient');
        const code = chosenRole === 'patient' ? `PELVI-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
        const namePart = trimmedEmail.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        profile = {
          id: `user-${trimmedEmail}`,
          name: formattedName,
          email: trimmedEmail,
          role: chosenRole,
          patient_code: code,
          created_at: new Date().toISOString(),
        };
        await DatabaseService.upsertProfile(profile);
      }

      setUser(profile);
      setRole(profile.role);
      setTargetPortal(profile.role);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Login failed.' };
    }
  };

  const signUp = async (name: string, email: string, pass: string, userRole: UserRole): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: pass,
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (data.user) {
          const code = userRole === 'patient' ? `PELVI-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
          const newProfile: UserProfile = {
            id: data.user.id,
            name: trimmedName,
            email: trimmedEmail,
            role: userRole,
            patient_code: code,
            created_at: new Date().toISOString(),
          };

          await DatabaseService.upsertProfile(newProfile);
          setUser(newProfile);
          setRole(newProfile.role);
          setTargetPortal(newProfile.role);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
          setIsLoading(false);
          return {};
        }
      }

      const code = userRole === 'patient' ? `PELVI-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
      const newProfile: UserProfile = {
        id: `user-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        role: userRole,
        patient_code: code,
        created_at: new Date().toISOString(),
      };

      await DatabaseService.upsertProfile(newProfile);
      setUser(newProfile);
      setRole(newProfile.role);
      setTargetPortal(newProfile.role);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Registration failed.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    setRole(null);
  };

  // When user clicks "Switch to Clinician" or "Switch to Patient", log out and direct them to the Login/Signup screen for that portal!
  const switchToPortal = async (targetRole: UserRole) => {
    await signOut();
    setTargetPortal(targetRole);
  };

  // One-click demo login helper
  const switchDemoRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    if (targetRole === 'clinician') {
      const prof: UserProfile = {
        id: 'mock-clinician-1',
        name: 'Dr. Sarah Jenkins',
        email: 'dr.jenkins@clinic.com',
        role: 'clinician',
        created_at: new Date().toISOString(),
      };
      setUser(prof);
      setRole('clinician');
      setTargetPortal('clinician');
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(prof));
    } else {
      const prof: UserProfile = {
        id: 'mock-patient-1',
        name: 'Lakshmi Devi',
        email: 'lakshmi@example.com',
        role: 'patient',
        patient_code: 'PELVI-4821',
        created_at: new Date().toISOString(),
      };
      setUser(prof);
      setRole('patient');
      setTargetPortal('patient');
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(prof));
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        targetPortal,
        setTargetPortal,
        signIn,
        signUp,
        signOut,
        switchToPortal,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
