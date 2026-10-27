import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
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

export const ClinicianProfileScreen: React.FC = () => {
  const { user, signOut, switchDemoRole } = useAuth();
  const [patientCount, setPatientCount] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      DatabaseService.getClinicianPatients(user.id).then((list) => {
        setPatientCount(list.length);
      });
    }
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Clinician Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="medkit" size={48} color={Colors.primaryDark} />
          </View>
          <Text style={styles.userName}>{user?.name || 'Dr. Sarah Jenkins'}</Text>
          <Text style={styles.userRole}>Licensed Pelvic Health Specialist</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Practice Overview Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>PRACTICE SUMMARY</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Connected Patients</Text>
            <Text style={styles.metricValue}>{patientCount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Clinical Account Status</Text>
            <Text style={[styles.metricValue, { color: Colors.success, fontSize: 18 }]}>
              Active Practitioner
            </Text>
          </View>
        </Card>

        {/* Demo Switcher for Presentation */}
        <View style={styles.demoSwitcherBox}>
          <Text style={styles.demoSwitcherTitle}>Hackathon Role Switcher:</Text>
          <TouchableOpacity
            onPress={() => switchDemoRole('patient')}
            style={styles.switchButton}
          >
            <Text style={styles.switchButtonText}>Switch to 👩 Patient View</Text>
          </TouchableOpacity>
        </View>

        <MedicalDisclaimer />

        {/* Log Out Button */}
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
    marginVertical: 18,
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
  userRole: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  metricLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  demoSwitcherBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 16,
    marginVertical: 16,
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
