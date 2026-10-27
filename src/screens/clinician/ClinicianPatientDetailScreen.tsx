import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { PrimaryButton } from '../../components/PrimaryButton';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { DatabaseService } from '../../services/dbService';
import { Colors } from '../../theme/colors';
import { ClinicianPatientSummary } from '../../types';

interface ClinicianPatientDetailScreenProps {
  route: {
    params: {
      summary: ClinicianPatientSummary;
    };
  };
  navigation: any;
}

export const ClinicianPatientDetailScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const summary: ClinicianPatientSummary = route.params.summary;

  // Training prescription state for clinician controls
  const [targetIntensity, setTargetIntensity] = useState<number>(
    summary.prescription.target_percentage || 65
  );
  const [holdDuration, setHoldDuration] = useState<number>(
    summary.prescription.hold_seconds || 5
  );
  const [goalRepetitions, setGoalRepetitions] = useState<number>(
    summary.prescription.goal_repetitions || 10
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSavePrescription = async () => {
    setIsSaving(true);
    try {
      await DatabaseService.updatePatientExercise(
        summary.profile.id,
        DEFAULT_EXERCISES[0].id,
        {
          target_percentage: targetIntensity,
          hold_seconds: holdDuration,
          goal_repetitions: goalRepetitions,
        }
      );
      Alert.alert(
        'Training Plan Saved',
        `Updated training targets for ${summary.profile.name}:\n• Target: ${targetIntensity}%\n• Hold: ${holdDuration}s\n• Goal: ${goalRepetitions} reps\n\nThe patient's app now displays these new settings.`
      );
    } catch (e: any) {
      Alert.alert('Save Error', e.message || 'Failed to update training plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Header */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Back to patients list"
        >
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
          <Text style={styles.backButtonText}>Patients List</Text>
        </TouchableOpacity>

        {/* Section 26: Patient Overview */}
        <View style={styles.headerTitleBox}>
          <Text style={styles.sectionHeading}>Patient Overview</Text>
          <Text style={styles.patientFullName}>{summary.profile.name}</Text>
          <Text style={styles.patientEmail}>
            {summary.profile.email} • Code: {summary.profile.patient_code || 'PELVI-4821'}
          </Text>
        </View>

        <Card style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Current Exercise:</Text>
            <Text style={styles.overviewValue}>Pelvic Floor Hold</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Current Target:</Text>
            <Text style={styles.overviewValue}>{targetIntensity}%</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Goal Repetitions:</Text>
            <Text style={styles.overviewValue}>{goalRepetitions} reps</Text>
          </View>
        </Card>

        {/* Section 27: CLINICIAN TRAINING CONTROLS */}
        <Text style={[styles.sectionHeading, { marginTop: 22, marginBottom: 8 }]}>
          Prescribed Training Controls
        </Text>
        <Card style={styles.controlsCard}>
          {/* Target Intensity Stepper */}
          <View style={styles.stepperContainer}>
            <View>
              <Text style={styles.stepperLabel}>Target intensity</Text>
              <Text style={styles.stepperSub}>Activation threshold percentage</Text>
            </View>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                onPress={() => setTargetIntensity((prev) => Math.max(30, prev - 5))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValueText}>{targetIntensity}%</Text>
              <TouchableOpacity
                onPress={() => setTargetIntensity((prev) => Math.min(95, prev + 5))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Hold Duration Stepper */}
          <View style={styles.stepperContainer}>
            <View>
              <Text style={styles.stepperLabel}>Hold duration</Text>
              <Text style={styles.stepperSub}>Contraction sustained time</Text>
            </View>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                onPress={() => setHoldDuration((prev) => Math.max(2, prev - 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValueText}>{holdDuration}s</Text>
              <TouchableOpacity
                onPress={() => setHoldDuration((prev) => Math.min(20, prev + 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Goal Repetitions Stepper */}
          <View style={styles.stepperContainer}>
            <View>
              <Text style={styles.stepperLabel}>Goal repetitions</Text>
              <Text style={styles.stepperSub}>Reps per daily session</Text>
            </View>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                onPress={() => setGoalRepetitions((prev) => Math.max(3, prev - 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValueText}>{goalRepetitions}</Text>
              <TouchableOpacity
                onPress={() => setGoalRepetitions((prev) => Math.min(30, prev + 1))}
                style={styles.stepBtn}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Large Save Button */}
          <PrimaryButton
            title="SAVE TRAINING PLAN"
            size="large"
            loading={isSaving}
            onPress={handleSavePrescription}
            style={{ marginTop: 20 }}
          />
        </Card>

        {/* Section 26: Repetition Summary */}
        <Text style={[styles.sectionHeading, { marginTop: 24, marginBottom: 8 }]}>
          Repetition Summary
        </Text>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Successful</Text>
            <Text style={[styles.summaryCount, { color: Colors.success }]}>
              {summary.successfulReps}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Missed</Text>
            <Text style={[styles.summaryCount, { color: Colors.warning }]}>
              {summary.missedReps}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Compensated</Text>
            <Text style={[styles.summaryCount, { color: Colors.danger }]}>
              {summary.compensatedReps}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Invalid</Text>
            <Text style={[styles.summaryCount, { color: Colors.textMuted }]}>
              {summary.invalidReps}
            </Text>
          </View>
        </Card>

        {/* Section 26: Recent Sessions */}
        <Text style={[styles.sectionHeading, { marginTop: 24, marginBottom: 8 }]}>
          Recent Sessions
        </Text>
        {summary.recentSessions.length === 0 ? (
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: Colors.textSecondary }}>
              No previous sessions recorded.
            </Text>
          </Card>
        ) : (
          summary.recentSessions.map((sess, i) => {
            const dateStr = sess.created_at
              ? new Date(sess.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';
            const rate =
              sess.total_repetitions > 0
                ? Math.round((sess.successful_repetitions / sess.total_repetitions) * 100)
                : 0;

            return (
              <Card key={sess.id || i} style={styles.recentSessionCard}>
                <View style={styles.recentSessionHeader}>
                  <Text style={styles.recentSessionDate}>{dateStr}</Text>
                  <View style={styles.ratePill}>
                    <Text style={styles.ratePillText}>{rate}% Success</Text>
                  </View>
                </View>
                <Text style={styles.recentExerciseName}>Pelvic Floor Hold</Text>
                <Text style={styles.recentBreakdown}>
                  {sess.successful_repetitions} OK • {sess.compensated_repetitions} Compensated •{' '}
                  {sess.missed_repetitions} Missed
                </Text>
              </Card>
            );
          })
        )}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 6,
  },
  headerTitleBox: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  patientFullName: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.primaryDark,
    marginTop: 4,
  },
  patientEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  overviewCard: {
    padding: 18,
    borderRadius: 20,
    gap: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  overviewLabel: {
    fontSize: 17,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  controlsCard: {
    padding: 20,
    borderRadius: 22,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepperLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  stepperSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  stepperValueText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    minWidth: 46,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: '900',
  },
  recentSessionCard: {
    padding: 16,
    borderRadius: 18,
    marginVertical: 6,
  },
  recentSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentSessionDate: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  ratePill: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratePillText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.success,
  },
  recentExerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  recentBreakdown: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
