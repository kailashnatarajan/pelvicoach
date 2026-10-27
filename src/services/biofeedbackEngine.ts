import { BiofeedbackReading, RepetitionResult } from '../types';

export interface RepetitionValidationResult {
  result: RepetitionResult;
  patientFeedback: string;
  isCounted: boolean; // Only 'OK' counts toward goal completion
  detail: string;
}

export interface AdaptiveTargetResult {
  hasUpdated: boolean;
  newTarget: number;
  message?: string;
  consecutiveSuccess: number;
  consecutiveFails: number;
}

/**
 * Validates a single repetition attempt based on biofeedback signals.
 * 
 * Rules:
 * 1. IF signal quality is bad -> INVALID
 * 2. ELSE IF abdominal activity is too high (>= 40% or abdominal > pelvic * 0.55) -> COMPENSATED
 * 3. ELSE IF pelvic activity is below target -> MISS
 * 4. ELSE -> OK
 */
export function validateRepetition(
  reading: BiofeedbackReading,
  targetPercentage: number,
  holdSecondsAchieved: number,
  requiredHoldSeconds: number
): RepetitionValidationResult {
  // 1. Signal Quality Check
  if (reading.signal_quality !== 'GOOD') {
    return {
      result: 'INVALID',
      patientFeedback: "We couldn't get a clear reading. Please check your sensor.",
      isCounted: false,
      detail: 'Signal quality degraded or electrical interference detected.',
    };
  }

  // 2. Abdominal Compensation Check
  // Patient is engaging abdominal rectus/oblique muscles instead of isolated pelvic floor
  const isCompensating = reading.abdominal_activity >= 38 || reading.abdominal_activity >= reading.pelvic_activity * 0.55;
  if (isCompensating) {
    return {
      result: 'COMPENSATED',
      patientFeedback: 'Try to relax your stomach muscles.',
      isCounted: false,
      detail: `Stomach activation (${reading.abdominal_activity}%) exceeded threshold.`,
    };
  }

  // 3. Pelvic Muscle Contraction Check (Target Intensity & Hold Duration)
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

  // 4. Successful Repetition
  return {
    result: 'OK',
    patientFeedback: '✓ GOOD JOB! Keep up the great work.',
    isCounted: true,
    detail: `Successful contraction (${reading.pelvic_activity}%) with relaxed stomach (${reading.abdominal_activity}%).`,
  };
}

/**
 * Evaluates real-time continuous feedback during an active contraction hold.
 */
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

/**
 * Adaptive Training Logic:
 * - 3 successful repetitions consecutively -> Increase target by 5% (max 95%).
 * - 2 unsuccessful repetitions (MISS or COMPENSATED) -> Decrease target by 5% (min 40%).
 * - Do NOT adapt based on INVALID readings.
 */
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
    const nextFails = 0;

    if (nextSuccess >= 3) {
      const updatedTarget = Math.min(95, currentTarget + 5);
      const changed = updatedTarget !== currentTarget;
      return {
        hasUpdated: changed,
        newTarget: updatedTarget,
        message: changed
          ? `YOUR TARGET HAS BEEN UPDATED\nYour new exercise target is ${updatedTarget}%.`
          : undefined,
        consecutiveSuccess: 0, // Reset counter after adaptation
        consecutiveFails: 0,
      };
    }

    return {
      hasUpdated: false,
      newTarget: currentTarget,
      consecutiveSuccess: nextSuccess,
      consecutiveFails: nextFails,
    };
  } else {
    // Result is 'MISS' or 'COMPENSATED'
    const nextSuccess = 0;
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
        consecutiveFails: 0, // Reset counter
      };
    }

    return {
      hasUpdated: false,
      newTarget: currentTarget,
      consecutiveSuccess: nextSuccess,
      consecutiveFails: nextFails,
    };
  }
}
