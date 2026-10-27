import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DatabaseService } from '../services/dbService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, pass: string, preferredRole?: UserRole) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, pass: string, role: UserRole) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const CURRENT_USER_KEY = '@pelvicoach_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore user session on app start
  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await DatabaseService.getProfile(session.user.id);
          if (profile) {
            setUser(profile);
            setRole(profile.role);
            setIsLoading(false);
            return;
          }
        }
      }

      // Check local storage for mock/demo session
      const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        setUser(parsed);
        setRole(parsed.role);
      }
    } catch (e) {
      console.warn('Session restoration error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (
    email: string,
    pass: string,
    preferredRole?: UserRole
  ): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: pass,
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (data.user) {
          const profile = await DatabaseService.getProfile(data.user.id);
          if (profile) {
            setUser(profile);
            setRole(profile.role);
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
            setIsLoading(false);
            return {};
          }
        }
      }

      // Demo / Mock Mode Sign In
      // If user logs in with sample email or any email, we retrieve or create the user profile
      let targetProfile = await DatabaseService.getProfile(`user-${trimmedEmail}`);
      if (!targetProfile) {
        const chosenRole: UserRole =
          preferredRole || (trimmedEmail.includes('clinician') || trimmedEmail.includes('dr') ? 'clinician' : 'patient');
        const code = chosenRole === 'patient' ? `PELVI-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
        const namePart = trimmedEmail.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        targetProfile = {
          id: `user-${trimmedEmail}`,
          name: formattedName,
          email: trimmedEmail,
          role: chosenRole,
          patient_code: code,
          created_at: new Date().toISOString(),
        };
        await DatabaseService.upsertProfile(targetProfile);
      }

      setUser(targetProfile);
      setRole(targetProfile.role);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(targetProfile));
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Login failed. Please check credentials.' };
    }
  };

  const signUp = async (
    name: string,
    email: string,
    pass: string,
    userRole: UserRole
  ): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: pass,
          options: {
            data: {
              name: trimmedName,
              role: userRole,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { error: error.message };
        }

        if (data.user) {
          const profile = await DatabaseService.getProfile(data.user.id);
          if (profile) {
            setUser(profile);
            setRole(profile.role);
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
          }
          setIsLoading(false);
          return {};
        }
      }

      // Demo Mode Registration
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
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newProfile));
      setIsLoading(false);
      return {};
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Registration failed.' };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      setRole(null);
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) return { error: error.message };
      return { message: 'Password reset link sent to your email.' };
    }
    return { message: 'Demo Mode: Reset link sent to your email (simulated).' };
  };

  // Demo helper for presentation to switch easily between Patient and Clinician
  const switchDemoRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    if (targetRole === 'clinician') {
      const clinicianProfile: UserProfile = {
        id: 'mock-clinician-1',
        name: 'Dr. Sarah Jenkins',
        email: 'dr.jenkins@clinic.com',
        role: 'clinician',
        created_at: new Date().toISOString(),
      };
      setUser(clinicianProfile);
      setRole('clinician');
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(clinicianProfile));
    } else {
      const patientProfile: UserProfile = {
        id: 'mock-patient-1',
        name: 'Lakshmi Devi',
        email: 'lakshmi@example.com',
        role: 'patient',
        patient_code: 'PELVI-4821',
        created_at: new Date().toISOString(),
      };
      setUser(patientProfile);
      setRole('patient');
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(patientProfile));
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
