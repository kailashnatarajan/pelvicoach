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
import { UserRole } from '../../types';

interface SignUpScreenProps {
  navigation: any;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await signUp(name, email, password, role);
    setLoading(false);

    if (res.error) {
      Alert.alert('Registration Notice', res.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back to login"
          >
            <Ionicons name="arrow-back" size={28} color={Colors.text} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PelviCoach for guided rehabilitation</Text>

          <View style={styles.formCard}>
            {/* Full Name */}
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Eleanor Vance"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            {/* Email */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. eleanor@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Account Type Large Selection */}
            <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Account Type</Text>
            <View style={styles.roleSelectionContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRole('patient')}
                style={[
                  styles.roleCard,
                  role === 'patient' && styles.roleCardActive,
                ]}
              >
                <Text style={styles.roleEmoji}>👩</Text>
                <Text
                  style={[
                    styles.roleTitle,
                    role === 'patient' && styles.roleTitleActive,
                  ]}
                >
                  PATIENT
                </Text>
                <Text style={styles.roleDesc}>Guided training & feedback</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setRole('clinician')}
                style={[
                  styles.roleCard,
                  role === 'clinician' && styles.roleCardActive,
                ]}
              >
                <Text style={styles.roleEmoji}>👨‍⚕️</Text>
                <Text
                  style={[
                    styles.roleTitle,
                    role === 'clinician' && styles.roleTitleActive,
                  ]}
                >
                  CLINICIAN
                </Text>
                <Text style={styles.roleDesc}>Patient monitoring & targets</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <PrimaryButton
              title="CREATE ACCOUNT"
              size="large"
              loading={loading}
              onPress={handleSignUp}
              style={{ marginTop: 28 }}
            />
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
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
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
  roleSelectionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleCardActive: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
  },
  roleEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  roleTitleActive: {
    color: Colors.primaryDark,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
