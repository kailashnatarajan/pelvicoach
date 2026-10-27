import { BiofeedbackReading, RepetitionResult } from '../types';

export interface RepetitionValidationResult {
  result: RepetitionResult;
  patientFeedback: string;
  isCounted: boolean;
  detail: string;
}

export interface AdaptiveTargetResult {
  hasUpdated: boolean;
  newTarget: number;
  message?: string;
  consecutiveSuccess: number;
  consecutiveFails: number;
}

export function validateRepetition(
  reading: BiofeedbackReading,
  targetPercentage: number,
  holdSecondsAchieved: number,
  requiredHoldSeconds: number
): RepetitionValidationResult {
  if (reading.signal_quality !== 'GOOD') {
    return {
      result: 'INVALID',
      patientFeedback: "We couldn't get a clear reading. Please check your sensor.",
      isCounted: false,
      detail: 'Signal quality degraded or electrical interference detected.',
    };
  }

  const isCompensating =
    reading.abdominal_activity >= 38 ||
    reading.abdominal_activity >= reading.pelvic_activity * 0.55;

  if (isCompensating) {
    return {
      result: 'COMPENSATED',
      patientFeedback: 'Try to relax your stomach muscles.',
      isCounted: false,
      detail: `Stomach activation (${reading.abdominal_activity}%) exceeded threshold.`,
    };
  }

  const reachedTarget = reading.pelvic_activity >= targetPercentage;
  const reachedHoldTime = holdSecondsAchieved >= requiredHoldSeconds;

  if (!reachedTarget || !reachedHoldTime) {
    return {
      result: 'MISS',
      patientFeedback: 'Try gently tightening a little more.',
      isCounted: false,
      detail: `Pelvic activity (${reading.pelvic_activity}%) below target (${targetPercentage}%).`,
    };
  }

  return {
    result: 'OK',
    patientFeedback: '✓ GOOD JOB! Keep up the great work.',
    isCounted: true,
    detail: `Successful contraction (${reading.pelvic_activity}%) with relaxed stomach (${reading.abdominal_activity}%).`,
  };
}

export function getRealtimeFeedback(
  reading: BiofeedbackReading,
  targetPercentage: number
): { message: string; status: 'ok' | 'warning' | 'danger' | 'neutral' } {
  if (reading.signal_quality !== 'GOOD') {
    return {
      message: "We couldn't get a clear reading. Please check your sensor.",
      status: 'neutral',
    };
  }

  if (reading.abdominal_activity >= 38 || reading.abdominal_activity >= reading.pelvic_activity * 0.55) {
    return {
      message: 'Relax your stomach muscles.',
      status: 'danger',
    };
  }

  if (reading.pelvic_activity < targetPercentage) {
    return {
      message: 'Gently tighten a little more.',
      status: 'warning',
    };
  }

  return {
    message: 'Great! Keep holding.',
    status: 'ok',
  };
}

export function evaluateAdaptiveTarget(
  lastResult: RepetitionResult,
  currentConsecutiveSuccess: number,
  currentConsecutiveFails: number,
  currentTarget: number
): AdaptiveTargetResult {
  if (lastResult === 'INVALID') {
    return {
      hasUpdated: false,
      newTarget: currentTarget,
      consecutiveSuccess: currentConsecutiveSuccess,
      consecutiveFails: currentConsecutiveFails,
    };
  }

  if (lastResult === 'OK') {
    const nextSuccess = currentConsecutiveSuccess + 1;
    if (nextSuccess >= 3) {
      const updatedTarget = Math.min(95, currentTarget + 5);
      const changed = updatedTarget !== currentTarget;
      return {
        hasUpdated: changed,
        newTarget: updatedTarget,
        message: changed
          ? `YOUR TARGET HAS BEEN UPDATED\nYour new exercise target is ${updatedTarget}%.`
          : undefined,
        consecutiveSuccess: 0,
        consecutiveFails: 0,
      };
    }
    return {
      hasUpdated: false,
      newTarget: currentTarget,
      consecutiveSuccess: nextSuccess,
      consecutiveFails: 0,
    };
  } else {
    const nextFails = currentConsecutiveFails + 1;
    if (nextFails >= 2) {
      const updatedTarget = Math.max(40, currentTarget - 5);
      const changed = updatedTarget !== currentTarget;
      return {
        hasUpdated: changed,
        newTarget: updatedTarget,
        message: changed
          ? `YOUR TARGET HAS BEEN ADJUSTED\nYour adjusted target is ${updatedTarget}%. Take your time!`
          : undefined,
        consecutiveSuccess: 0,
        consecutiveFails: 0,
      };
    }
    return {
      hasUpdated: false,
      newTarget: currentTarget,
      consecutiveSuccess: 0,
      consecutiveFails: nextFails,
    };
  }
}
