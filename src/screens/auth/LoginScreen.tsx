import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { signIn, switchDemoRole, resetPassword } = useAuth();
  const [email, setEmail] = useState<string>('lakshmi@example.com');
  const [password, setPassword] = useState<string>('password123');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      Alert.alert('Login Notice', res.error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to receive reset instructions.');
      return;
    }
    const res = await resetPassword(email);
    Alert.alert('Password Reset', res.message || res.error || 'Check your email inbox.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart-circle" size={54} color={Colors.primaryDark} />
            </View>
            <Text style={styles.appName}>PelviCoach</Text>
            <Text style={styles.tagline}>Your guided rehabilitation companion</Text>
          </View>

          {/* Form Fields - Large & High Contrast */}
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. name@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email input"
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password input"
            />

            {/* Large Login Button */}
            <PrimaryButton
              title="LOGIN"
              size="large"
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: 24 }}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotButton}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Account Creation Prompt */}
          <View style={styles.createAccountSection}>
            <Text style={styles.createPromptText}>Don't have an account?</Text>
            <PrimaryButton
              title="CREATE ACCOUNT"
              variant="outline"
              size="large"
              onPress={() => navigation.navigate('SignUp')}
              style={{ marginTop: 10 }}
            />
          </View>

          {/* Hackathon Fast-Demo Switchers */}
          <View style={styles.demoShortcutSection}>
            <Text style={styles.demoHeading}>⚡ Quick Demo Sign In:</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                onPress={() => switchDemoRole('patient')}
                style={styles.demoRolePill}
              >
                <Text style={styles.demoRoleText}>👩 Patient Demo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchDemoRole('clinician')}
                style={styles.demoRolePill}
              >
                <Text style={styles.demoRoleText}>👨‍⚕️ Clinician Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: Colors.text,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
    textDecorationLine: 'underline',
  },
  createAccountSection: {
    marginTop: 28,
    alignItems: 'center',
  },
  createPromptText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  demoShortcutSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
  },
  demoHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3730A3',
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  demoRolePill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  demoRoleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3730A3',
  },
});
