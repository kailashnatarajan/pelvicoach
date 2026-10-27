import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BiofeedbackBanner } from '../../components/BiofeedbackBanner';
import { CircularTimer } from '../../components/CircularTimer';
import { DemoControlPanel } from '../../components/DemoControlPanel';
import { MuscleActivityGauge } from '../../components/MuscleActivityGauge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { useAuth } from '../../context/AuthContext';
import {
  evaluateAdaptiveTarget,
  getRealtimeFeedback,
  validateRepetition,
} from '../../services/biofeedbackEngine';
import { DatabaseService } from '../../services/dbService';
import { demoSimulator } from '../../services/demoSimulator';
import { Colors } from '../../theme/colors';
import {
  Attempt,
  BiofeedbackReading,
  Exercise,
  PatientExercise,
  RepetitionResult,
} from '../../types';

interface TrainingScreenProps {
  route: {
    params: {
      exercise?: Exercise;
      prescribed?: PatientExercise;
    };
  };
  navigation: any;
}

type TrainingPhase = 'prepare' | 'contract' | 'relax' | 'finished';

export const TrainingScreen: React.FC<any> = ({ route, navigation }) => {
  const { user } = useAuth();
  const exercise = route.params?.exercise || DEFAULT_EXERCISES[0];
  const initialPrescribed = route.params?.prescribed;

  // Exercise Targets
  const [targetPercentage, setTargetPercentage] = useState<number>(
    initialPrescribed?.target_percentage ?? exercise.default_target
  );
  const [holdDuration] = useState<number>(
    initialPrescribed?.hold_seconds ?? exercise.default_hold
  );
  const [goalRepetitions] = useState<number>(
    initialPrescribed?.goal_repetitions ?? exercise.default_repetitions
  );

  // Training state
  const [currentRep, setCurrentRep] = useState<number>(1);
  const [successfulReps, setSuccessfulReps] = useState<number>(0);
  const [missedReps, setMissedReps] = useState<number>(0);
  const [compensatedReps, setCompensatedReps] = useState<number>(0);
  const [invalidReps, setInvalidReps] = useState<number>(0);

  // Phase & Timing
  const [phase, setPhase] = useState<TrainingPhase>('prepare');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3); // 3s prepare
  const [activeFeedback, setActiveFeedback] = useState<string>('Get ready to squeeze...');
  const [bannerStatus, setBannerStatus] = useState<'ok' | 'warning' | 'danger' | 'neutral'>('ok');
  const [lastResult, setLastResult] = useState<RepetitionResult | null>(null);

  // Biofeedback live values
  const [reading, setReading] = useState<BiofeedbackReading>({
    pelvic_activity: 5,
    abdominal_activity: 5,
    signal_quality: 'GOOD',
    timestamp: Date.now(),
  });

  // Adaptive Counters
  const [consecutiveSuccess, setConsecutiveSuccess] = useState<number>(0);
  const [consecutiveFails, setConsecutiveFails] = useState<number>(0);
  const [adaptiveModalVisible, setAdaptiveModalVisible] = useState<boolean>(false);
  const [adaptiveModalMessage, setAdaptiveModalMessage] = useState<string>('');

  // Session Logging
  const attemptsRef = useRef<Array<Omit<Attempt, 'id' | 'session_id' | 'created_at'>>>([]);
  const startTimeRef = useRef<string>(new Date().toISOString());
  const timerIntervalRef = useRef<any>(null);
  const readingRef = useRef<BiofeedbackReading>(reading);
  readingRef.current = reading;

  // Subscribe to simulated / real biofeedback stream
  useEffect(() => {
    const unsubscribe = demoSimulator.subscribe((newReading) => {
      setReading(newReading);
    });

    return () => {
      unsubscribe();
      demoSimulator.setContracting(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Main Exercise State Machine Loop
  useEffect(() => {
    if (phase === 'finished') return;

    if (phase === 'prepare') {
      demoSimulator.setContracting(false);
      setActiveFeedback('Get ready to squeeze gently...');
      setBannerStatus('neutral');

      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            // Switch to CONTRACT phase
            setPhase('contract');
            setRemainingSeconds(holdDuration);
            demoSimulator.setContracting(true);
            return holdDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'contract') {
      demoSimulator.setContracting(true);

      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          // Provide real-time dynamic guidance during hold
          const currentRealtime = getRealtimeFeedback(readingRef.current, targetPercentage);
          setActiveFeedback(currentRealtime.message);
          setBannerStatus(currentRealtime.status);

          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            // Evaluate rep at completion of hold
            finishRepetition();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'relax') {
      demoSimulator.setContracting(false);

      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            // Advance to next rep or finish
            if (currentRep >= goalRepetitions) {
              setPhase('finished');
              finishSession();
            } else {
              setCurrentRep((r) => r + 1);
              setPhase('contract');
              setRemainingSeconds(holdDuration);
              demoSimulator.setContracting(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, currentRep]);

  // Evaluates repetition upon hold timer expiration
  const finishRepetition = () => {
    demoSimulator.setContracting(false);
    const finalReading = readingRef.current;

    const validation = validateRepetition(
      finalReading,
      targetPercentage,
      holdDuration,
      holdDuration
    );

    setLastResult(validation.result);
    setActiveFeedback(validation.patientFeedback);

    // Repetition counter updates
    let updatedSuccess = successfulReps;
    if (validation.result === 'OK') {
      updatedSuccess += 1;
      setSuccessfulReps(updatedSuccess);
      setBannerStatus('ok');
    } else if (validation.result === 'COMPENSATED') {
      setCompensatedReps((prev) => prev + 1);
      setBannerStatus('danger');
    } else if (validation.result === 'MISS') {
      setMissedReps((prev) => prev + 1);
      setBannerStatus('warning');
    } else {
      setInvalidReps((prev) => prev + 1);
      setBannerStatus('neutral');
    }

    // Record attempt for history
    attemptsRef.current.push({
      rep_number: currentRep,
      result: validation.result,
      target_percentage: targetPercentage,
      pelvic_activity: finalReading.pelvic_activity,
      abdominal_activity: finalReading.abdominal_activity,
      hold_seconds: holdDuration,
      feedback: validation.patientFeedback,
    });

    // Adaptive Training Evaluation
    const adaptive = evaluateAdaptiveTarget(
      validation.result,
      consecutiveSuccess,
      consecutiveFails,
      targetPercentage
    );

    setConsecutiveSuccess(adaptive.consecutiveSuccess);
    setConsecutiveFails(adaptive.consecutiveFails);

    if (adaptive.hasUpdated) {
      setTargetPercentage(adaptive.newTarget);
      setAdaptiveModalMessage(adaptive.message || '');
      setAdaptiveModalVisible(true);

      // Persist new target for patient in background
      if (user) {
        DatabaseService.updatePatientExercise(user.id, exercise.id, {
          target_percentage: adaptive.newTarget,
        }).catch((e) => console.warn('Adaptive target save error:', e));
      }
    }

    // Switch to Relax Phase (3 seconds of rest before next repetition)
    setPhase('relax');
    setRemainingSeconds(3);
  };

  const finishSession = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    demoSimulator.setContracting(false);

    navigation.replace('SessionSummary', {
      exercise,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      totalRepetitions: currentRep,
      successfulRepetitions: successfulReps + (lastResult === 'OK' ? 1 : 0),
      missedRepetitions: missedReps + (lastResult === 'MISS' ? 1 : 0),
      compensatedRepetitions: compensatedReps + (lastResult === 'COMPENSATED' ? 1 : 0),
      invalidRepetitions: invalidReps + (lastResult === 'INVALID' ? 1 : 0),
      attempts: attemptsRef.current,
    });
  };

  const confirmEndSession = () => {
    Alert.alert(
      'Finish Session Early?',
      'Would you like to complete and save your progress so far?',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Finish Now', style: 'default', onPress: finishSession },
      ]
    );
  };

  const isCompensating =
    reading.abdominal_activity >= 38 ||
    reading.abdominal_activity >= reading.pelvic_activity * 0.55;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Pelvic Floor Exercise</Text>
          <TouchableOpacity
            onPress={confirmEndSession}
            style={styles.stopButton}
            accessibilityLabel="Finish exercise"
          >
            <Ionicons name="close-circle-outline" size={32} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Large Circular Timer */}
        <CircularTimer
          totalSeconds={phase === 'contract' ? holdDuration : 3}
          remainingSeconds={remainingSeconds}
          label="SECONDS"
          phase={phase === 'prepare' ? 'prepare' : phase === 'contract' ? 'contract' : 'relax'}
        />

        {/* Real-Time Biofeedback Muscle Activity Gauge */}
        <MuscleActivityGauge
          pelvicActivity={reading.pelvic_activity}
          abdominalActivity={reading.abdominal_activity}
          targetPercentage={targetPercentage}
          isCompensating={isCompensating}
        />

        {/* Repetitions Tracker */}
        <View style={styles.repCounterCard}>
          <Text style={styles.repCounterLabel}>Repetitions</Text>
          <Text style={styles.repCounterValue}>
            {Math.min(currentRep, goalRepetitions)} / {goalRepetitions}
          </Text>
        </View>

        {/* Large Patient-Friendly Feedback Banner */}
        <BiofeedbackBanner
          message={activeFeedback}
          result={phase === 'relax' ? lastResult : null}
          status={bannerStatus}
        />

        {/* Hackathon Presenter Demo Controls */}
        <DemoControlPanel />

        {/* Primary Action Button */}
        <PrimaryButton
          title="END SESSION"
          variant="outline"
          size="normal"
          onPress={confirmEndSession}
          style={{ marginTop: 12, marginBottom: 20 }}
        />
      </ScrollView>

      {/* Adaptive Target Alert Modal (Section 21) */}
      <Modal
        visible={adaptiveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdaptiveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="trending-up" size={44} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>YOUR TARGET HAS BEEN UPDATED</Text>
            <Text style={styles.modalMessage}>{adaptiveModalMessage}</Text>
            <PrimaryButton
              title="CONTINUE"
              size="large"
              onPress={() => setAdaptiveModalVisible(false)}
              style={{ marginTop: 20, width: '100%' }}
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
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
  },
  stopButton: {
    padding: 6,
  },
  repCounterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginVertical: 8,
  },
  repCounterLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  repCounterValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalMessage: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 26,
  },
});
