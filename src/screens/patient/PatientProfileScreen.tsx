import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/dbService';
import { Colors } from '../../theme/colors';
import { UserProfile } from '../../types';

export const PatientProfileScreen: React.FC = () => {
  const { user, signOut, switchDemoRole } = useAuth();
  const [clinician, setClinician] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user?.id) {
      DatabaseService.getConnectedClinician(user.id).then((c) => setClinician(c));
    }
  }, [user?.id]);

  const handleCopyCode = () => {
    Alert.alert('Patient Code', `Your clinical connection code is: ${user?.patient_code || 'PELVI-4821'}\nShare this code with your doctor.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Identity Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={48} color={Colors.primaryDark} />
          </View>
          <Text style={styles.userName}>{user?.name || 'PelviCoach Patient'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Patient Clinical Connection Code */}
        <Card style={styles.codeCard}>
          <Text style={styles.cardSectionTitle}>YOUR PATIENT LINK CODE</Text>
          <Text style={styles.codeExplainer}>
            Provide this code to your doctor or clinician to connect:
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCopyCode}
            style={styles.codeBox}
          >
            <Text style={styles.codeValue}>{user?.patient_code || 'PELVI-4821'}</Text>
            <Ionicons name="copy-outline" size={24} color={Colors.primaryDark} />
          </TouchableOpacity>
        </Card>

        {/* Clinical Care Details */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>CARE DETAILS</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Connected Clinician:</Text>
            <Text style={styles.infoValue}>
              {clinician ? clinician.name : 'Dr. Sarah Jenkins'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Training Goal:</Text>
            <Text style={styles.infoValue}>Pelvic Floor Strengthening</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status:</Text>
            <Text style={[styles.infoValue, { color: Colors.success }]}>Active Patient</Text>
          </View>
        </Card>

        {/* Quick Demo Switcher for Judges */}
        <View style={styles.demoSwitcherBox}>
          <Text style={styles.demoSwitcherTitle}>Hackathon Role Switcher:</Text>
          <TouchableOpacity
            onPress={() => switchDemoRole('clinician')}
            style={styles.switchButton}
          >
            <Text style={styles.switchButtonText}>Switch to 👨‍⚕️ Clinician View</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Disclaimer */}
        <MedicalDisclaimer />

        {/* Large Log Out Button */}
        <PrimaryButton
          title="LOG OUT"
          variant="outline"
          size="large"
          onPress={signOut}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 17,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  codeCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    borderColor: Colors.primaryBorder,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  codeExplainer: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  codeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  codeValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: 2,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
  },
  infoRow: {
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  demoSwitcherBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    alignItems: 'center',
  },
  demoSwitcherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3730A3',
    marginBottom: 8,
  },
  switchButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  switchButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3730A3',
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 20,
    borderColor: Colors.danger,
  },
});
