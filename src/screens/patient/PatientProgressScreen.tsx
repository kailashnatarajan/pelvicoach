import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/dbService';
import { Colors } from '../../theme/colors';
import { PatientExercise, Session } from '../../types';

export const PatientProgressScreen: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prescribed, setPrescribed] = useState<PatientExercise | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadProgress = async () => {
    if (!user) return;
    try {
      const history = await DatabaseService.getPatientSessions(user.id);
      setSessions(history);

      const plan = await DatabaseService.getPatientExercise(user.id, DEFAULT_EXERCISES[0].id);
      setPrescribed(plan);
    } catch (e) {
      console.warn('Error loading patient progress:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [user?.id])
  );

  let totalSuccessfulReps = 0;
  let totalCompensatedReps = 0;
  let totalMissedReps = 0;

  sessions.forEach((s) => {
    totalSuccessfulReps += s.successful_repetitions;
    totalCompensatedReps += s.compensated_repetitions;
    totalMissedReps += s.missed_repetitions;
  });

  const currentTarget = prescribed?.target_percentage ?? 65;
  const currentGoal = prescribed?.goal_repetitions ?? 10;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProgress();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSub}>Celebrate every step in your rehabilitation</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Big Metrics Cards Grid */}
            <View style={styles.cardsGrid}>
              <Card style={styles.statCard}>
                <Ionicons name="calendar-outline" size={28} color={Colors.primaryDark} />
                <Text style={styles.statCardLabel}>SESSIONS</Text>
                <Text style={styles.statCardValue}>{sessions.length}</Text>
              </Card>

              <Card style={styles.statCard}>
                <Ionicons name="ribbon-outline" size={28} color={Colors.success} />
                <Text style={styles.statCardLabel}>SUCCESSFUL REPS</Text>
                <Text style={[styles.statCardValue, { color: Colors.success }]}>
                  {totalSuccessfulReps}
                </Text>
              </Card>

              <Card style={styles.statCard}>
                <Ionicons name="speedometer-outline" size={28} color={Colors.secondary} />
                <Text style={styles.statCardLabel}>CURRENT TARGET</Text>
                <Text style={[styles.statCardValue, { color: Colors.secondary }]}>
                  {currentTarget}%
                </Text>
              </Card>

              <Card style={styles.statCard}>
                <Ionicons name="flag-outline" size={28} color={Colors.warning} />
                <Text style={styles.statCardLabel}>CURRENT GOAL</Text>
                <Text style={[styles.statCardValue, { color: Colors.warning }]}>
                  {currentGoal} reps
                </Text>
              </Card>
            </View>

            {/* Quality Summary */}
            <Card style={styles.qualityCard}>
              <Text style={styles.sectionHeading}>Repetition Quality</Text>
              <View style={styles.qualityBarWrapper}>
                <View style={styles.qualityLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.legendText}>Successful ({totalSuccessfulReps})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                    <Text style={styles.legendText}>Attention ({totalCompensatedReps})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.legendText}>Missed ({totalMissedReps})</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Recent Sessions List */}
            <Text style={[styles.sectionHeading, { marginTop: 24, marginBottom: 10 }]}>
              Recent Sessions
            </Text>

            {sessions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No sessions recorded yet.</Text>
                <Text style={styles.emptySub}>Start today's exercise to see your history!</Text>
              </Card>
            ) : (
              sessions.slice(0, 5).map((s, idx) => {
                const dateStr = s.created_at
                  ? new Date(s.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent';

                return (
                  <Card key={s.id || idx} style={styles.sessionItemCard}>
                    <View style={styles.sessionItemRow}>
                      <View>
                        <Text style={styles.sessionDate}>{dateStr}</Text>
                        <Text style={styles.sessionReps}>
                          {s.total_repetitions} total repetitions
                        </Text>
                      </View>
                      <View style={styles.successPill}>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                        <Text style={styles.successPillText}>
                          {s.successful_repetitions} Good
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </>
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
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cardsGrid: {
    gap: 12,
  },
  statCard: {
    padding: 20,
    borderRadius: 20,
    marginVertical: 4,
  },
  statCardLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  statCardValue: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  qualityCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 14,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  qualityBarWrapper: {
    marginTop: 12,
  },
  qualityLegend: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sessionItemCard: {
    padding: 16,
    marginVertical: 6,
    borderRadius: 16,
  },
  sessionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  sessionReps: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  successPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
