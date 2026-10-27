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
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/dbService';
import { Colors } from '../../theme/colors';
import { Exercise, PatientExercise } from '../../types';

interface PatientHomeScreenProps {
  navigation: any;
}

export const PatientHomeScreen: React.FC<PatientHomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise>(DEFAULT_EXERCISES[0]);
  const [prescribed, setPrescribed] = useState<PatientExercise | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const exercises = await DatabaseService.getExercises();
      const currentExercise = exercises[0] || DEFAULT_EXERCISES[0];
      setExercise(currentExercise);

      const plan = await DatabaseService.getPatientExercise(user.id, currentExercise.id);
      setPrescribed(plan);
    } catch (e) {
      console.warn('Error loading patient home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const goalReps = prescribed?.goal_repetitions ?? exercise.default_repetitions;
  const holdSecs = prescribed?.hold_seconds ?? exercise.default_hold;
  const targetPct = prescribed?.target_percentage ?? exercise.default_target;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Top Greeting */}
        <View style={styles.greetingHeader}>
          <Text style={styles.greetingText}>
            {getGreeting()}, {firstName} 👋
          </Text>
          <Text style={styles.greetingSubtext}>Ready for today's gentle session?</Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Primary Action Card: TODAY'S EXERCISE */}
            <Card variant="highlight" style={styles.todayCard}>
              <View style={styles.tagBadge}>
                <Ionicons name="sparkles" size={16} color={Colors.primaryDark} style={{ marginRight: 6 }} />
                <Text style={styles.tagBadgeText}>TODAY'S EXERCISE</Text>
              </View>

              <Text style={styles.exerciseTitle}>{exercise.name}</Text>
              <Text style={styles.exerciseDescription}>
                "{exercise.description}"
              </Text>

              {/* Targets Summary Grid */}
              <View style={styles.metricsContainer}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Goal</Text>
                  <Text style={styles.metricValue}>{goalReps}</Text>
                  <Text style={styles.metricUnit}>repetitions</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Hold</Text>
                  <Text style={styles.metricValue}>{holdSecs}</Text>
                  <Text style={styles.metricUnit}>seconds</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Target</Text>
                  <Text style={styles.metricValue}>{targetPct}%</Text>
                  <Text style={styles.metricUnit}>intensity</Text>
                </View>
              </View>

              {/* Big START EXERCISE Button */}
              <PrimaryButton
                title="START EXERCISE"
                size="large"
                icon={<Ionicons name="play" size={24} color="#FFFFFF" />}
                onPress={() =>
                  navigation.navigate('Training', {
                    exercise,
                    prescribed,
                  })
                }
                style={styles.startButton}
              />

              {/* Secondary WATCH HOW TO DO IT Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ExerciseDetail', {
                    exercise,
                    prescribed,
                  })
                }
                style={styles.watchButton}
                accessibilityLabel="Watch how to perform the exercise video"
              >
                <Ionicons name="videocam-outline" size={24} color={Colors.primaryDark} />
                <Text style={styles.watchButtonText}>WATCH HOW TO DO IT</Text>
              </TouchableOpacity>
            </Card>

            {/* Reassuring Guidance Banner */}
            <View style={styles.tipCard}>
              <Ionicons name="leaf-outline" size={28} color={Colors.primary} />
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>Gentle Reminder</Text>
                <Text style={styles.tipBody}>
                  Remember to breathe steadily. Do not hold your breath or push with your tummy.
                </Text>
              </View>
            </View>
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
    paddingBottom: 32,
  },
  greetingHeader: {
    marginTop: 10,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  greetingSubtext: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  todayCard: {
    padding: 24,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  tagBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 18,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 26,
    marginBottom: 22,
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primaryDark,
    marginVertical: 2,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  startButton: {
    marginBottom: 14,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    minHeight: 56,
  },
  watchButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  tipTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  tipBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
});
