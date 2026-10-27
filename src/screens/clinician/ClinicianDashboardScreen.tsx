import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/dbService';
import { Colors } from '../../theme/colors';
import { ClinicianPatientSummary } from '../../types';

interface ClinicianDashboardScreenProps {
  navigation: any;
}

export const ClinicianDashboardScreen: React.FC<ClinicianDashboardScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<ClinicianPatientSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Link Patient Modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [patientCodeInput, setPatientCodeInput] = useState<string>('PELVI-4821');
  const [linking, setLinking] = useState<boolean>(false);

  const fetchPatients = async () => {
    if (!user) return;
    try {
      const data = await DatabaseService.getClinicianPatients(user.id);
      setPatients(data);
    } catch (e) {
      console.warn('Error fetching clinician patients:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [user?.id])
  );

  const handleLinkPatient = async () => {
    if (!patientCodeInput.trim()) {
      Alert.alert('Required', 'Please enter a patient connection code (e.g. PELVI-4821).');
      return;
    }

    if (!user) return;

    setLinking(true);
    const result = await DatabaseService.linkPatientByCode(user.id, patientCodeInput);
    setLinking(false);

    if (result.success) {
      Alert.alert('Success', result.message);
      setModalVisible(false);
      setPatientCodeInput('');
      fetchPatients();
    } else {
      Alert.alert('Notice', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPatients();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Clinician Portal Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.clinicTitle}>Clinician Portal</Text>
            <Text style={styles.doctorGreeting}>Welcome, {user?.name || 'Dr. Jenkins'}</Text>
          </View>
          <TouchableOpacity
            style={styles.linkHeaderBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Link new patient"
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.linkHeaderBtnText}>Link Patient</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>My Patients ({patients.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : patients.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={54} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Connected Patients</Text>
            <Text style={styles.emptySub}>
              Enter a patient's connection code to link them to your clinical practice.
            </Text>
            <PrimaryButton
              title="Link Patient Code"
              size="normal"
              onPress={() => setModalVisible(true)}
              style={{ marginTop: 16 }}
            />
          </Card>
        ) : (
          patients.map((item) => (
            <Card key={item.profile.id} style={styles.patientCard}>
              <View style={styles.patientCardTop}>
                <View>
                  <Text style={styles.patientName}>{item.profile.name}</Text>
                  <Text style={styles.patientCode}>Code: {item.profile.patient_code || 'N/A'}</Text>
                </View>
                <View style={styles.successBadge}>
                  <Text style={styles.successBadgeText}>{item.successRate}% Success</Text>
                </View>
              </View>

              <View style={styles.patientStatsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Last session</Text>
                  <Text style={styles.statVal}>
                    {item.lastSessionDate
                      ? new Date(item.lastSessionDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Today'}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Current target</Text>
                  <Text style={styles.statVal}>{item.prescription.target_percentage}%</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Hold / Reps</Text>
                  <Text style={styles.statVal}>
                    {item.prescription.hold_seconds}s / {item.prescription.goal_repetitions}
                  </Text>
                </View>
              </View>

              <PrimaryButton
                title="VIEW PATIENT"
                size="normal"
                variant="primary"
                onPress={() => navigation.navigate('ClinicianPatientDetail', { summary: item })}
                style={{ marginTop: 16 }}
              />
            </Card>
          ))
        )}
      </ScrollView>

      {/* Link Patient Code Modal (Section 28) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect New Patient</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Ask your patient for their connection code (found on their profile screen, e.g.
              PELVI-4821):
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. PELVI-4821"
              placeholderTextColor={Colors.textMuted}
              value={patientCodeInput}
              onChangeText={setPatientCodeInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <PrimaryButton
              title="CONNECT PATIENT"
              size="large"
              loading={linking}
              onPress={handleLinkPatient}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  clinicTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  doctorGreeting: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 2,
  },
  linkHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 6,
  },
  linkHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 14,
  },
  patientCard: {
    padding: 20,
    borderRadius: 22,
    marginBottom: 14,
  },
  patientCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  patientCode: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  successBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  successBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.success,
  },
  patientStatsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginTop: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  modalSub: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
});
