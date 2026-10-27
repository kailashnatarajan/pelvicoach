import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/dbService';
import { Colors } from '../../theme/colors';
import { Attempt, Exercise } from '../../types';

interface SessionSummaryScreenProps {
  route: {
    params: {
      exercise: Exercise;
      startTime: string;
      endTime: string;
      totalRepetitions: number;
      successfulRepetitions: number;
      missedRepetitions: number;
      compensatedRepetitions: number;
      invalidRepetitions: number;
      attempts: Array<Omit<Attempt, 'id' | 'session_id' | 'created_at'>>;
    };
  };
  navigation: any;
}

export const SessionSummaryScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const { user } = useAuth();
  const {
    exercise,
    startTime,
    endTime,
    totalRepetitions,
    successfulRepetitions,
    missedRepetitions,
    compensatedRepetitions,
    invalidRepetitions,
    attempts,
  } = route.params;

  const [saving, setSaving] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    saveSessionData();
  }, []);

  const saveSessionData = async () => {
    if (!user) {
      setSaving(false);
      return;
    }
    try {
      await DatabaseService.saveSession(
        {
          patient_id: user.id,
          exercise_id: exercise.id,
          start_time: startTime,
          end_time: endTime,
          total_repetitions: totalRepetitions,
          successful_repetitions: successfulRepetitions,
          missed_repetitions: missedRepetitions,
          compensated_repetitions: compensatedRepetitions,
          invalid_repetitions: invalidRepetitions,
        },
        attempts || []
      );
      setSavedSuccess(true);
    } catch (e) {
      console.warn('Error saving session:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Celebration Header */}
        <View style={styles.header}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={54} color={Colors.primaryDark} />
          </View>
          <Text style={styles.mainTitle}>GREAT WORK! 🎉</Text>
          <Text style={styles.subTitle}>You have completed your guided session</Text>
        </View>

        {/* Breakdown Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardHeader}>Today's Session</Text>
          <Text style={styles.exerciseName}>{exercise.name}</Text>

          <View style={styles.statList}>
            {/* Successful */}
            <View style={styles.statRow}>
              <View style={styles.statLabelGroup}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.statLabel}>Successful</Text>
              </View>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {successfulRepetitions}
              </Text>
            </View>

            {/* Missed */}
            <View style={styles.statRow}>
              <View style={styles.statLabelGroup}>
                <Ionicons name="help-circle" size={24} color={Colors.warning} />
                <Text style={styles.statLabel}>Missed</Text>
              </View>
              <Text style={[styles.statValue, { color: Colors.warning }]}>
                {missedRepetitions}
              </Text>
            </View>

            {/* Needs Attention (Compensated) */}
            <View style={styles.statRow}>
              <View style={styles.statLabelGroup}>
                <Ionicons name="alert-circle" size={24} color={Colors.danger} />
                <Text style={styles.statLabel}>Needs attention</Text>
              </View>
              <Text style={[styles.statValue, { color: Colors.danger }]}>
                {compensatedRepetitions}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Total */}
            <View style={styles.statRow}>
              <Text style={styles.totalLabel}>Total Repetitions</Text>
              <Text style={styles.totalValue}>{totalRepetitions}</Text>
            </View>
          </View>

          {/* Database Synchronization Indicator */}
          <View style={styles.syncIndicator}>
            {saving ? (
              <>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.syncText}>Saving session to database...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-done" size={20} color={Colors.success} />
                <Text style={[styles.syncText, { color: Colors.success }]}>
                  Session saved successfully
                </Text>
              </>
            )}
          </View>
        </Card>

        {/* Done Button */}
        <PrimaryButton
          title="DONE"
          size="large"
          onPress={() => navigation.navigate('Home')}
          style={{ marginTop: 24, marginBottom: 20 }}
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
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 24,
    borderRadius: 24,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
    marginBottom: 20,
  },
  statList: {
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  syncText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
