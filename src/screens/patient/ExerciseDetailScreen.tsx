import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ExerciseVideoPlayer } from '../../components/ExerciseVideoPlayer';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { Colors } from '../../theme/colors';
import { Exercise, PatientExercise } from '../../types';

interface ExerciseDetailScreenProps {
  route: {
    params: {
      exercise?: Exercise;
      prescribed?: PatientExercise;
    };
  };
  navigation: any;
}

export const ExerciseDetailScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const exercise = route.params?.exercise || DEFAULT_EXERCISES[0];
  const prescribed = route.params?.prescribed;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Navigation */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Large Exercise Video Player */}
        <ExerciseVideoPlayer
          videoFilename={exercise.video_filename}
          exerciseTitle={exercise.name}
        />

        {/* Exercise Information */}
        <View style={styles.infoSection}>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={18} color={Colors.primaryDark} />
              <Text style={styles.badgeText}>{exercise.duration}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="barbell-outline" size={18} color={Colors.primaryDark} />
              <Text style={styles.badgeText}>{exercise.difficulty}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Instructions</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>{exercise.instructions}</Text>
          </View>

          {/* Clinical Prescription Targets Box */}
          <View style={styles.targetsCard}>
            <Text style={styles.targetsTitle}>Your Prescription</Text>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>Goal Repetitions:</Text>
              <Text style={styles.targetValue}>
                {prescribed?.goal_repetitions ?? exercise.default_repetitions} reps
              </Text>
            </View>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>Hold Duration:</Text>
              <Text style={styles.targetValue}>
                {prescribed?.hold_seconds ?? exercise.default_hold} seconds
              </Text>
            </View>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>Target Intensity:</Text>
              <Text style={styles.targetValue}>
                {prescribed?.target_percentage ?? exercise.default_target}%
              </Text>
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
            style={{ marginTop: 24 }}
          />
        </View>
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
  infoSection: {
    marginTop: 20,
  },
  exerciseTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  instructionText: {
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textSecondary,
  },
  targetsCard: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  targetsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  targetLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
