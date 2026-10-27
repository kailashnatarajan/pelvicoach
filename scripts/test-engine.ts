/**
 * Automated Verification Script for PelviCoach Core Logic
 * Tests:
 * 1. Repetition validation (OK, COMPENSATED, MISS, INVALID)
 * 2. Patient-friendly feedback messages
 * 3. Adaptive target adjustment logic
 */

import {
  evaluateAdaptiveTarget,
  getRealtimeFeedback,
  validateRepetition,
} from '../src/services/biofeedbackEngine';
import { BiofeedbackReading } from '../src/types';

function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PELVICOACH BIOFEEDBACK ENGINE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Correct contraction (Normal scenario)
  const normalReading: BiofeedbackReading = {
    pelvic_activity: 78,
    abdominal_activity: 14,
    signal_quality: 'GOOD',
    timestamp: Date.now(),
  };
  const res1 = validateRepetition(normalReading, 65, 5, 5);
  assert(res1.result === 'OK', 'Normal contraction returns result OK');
  assert(res1.isCounted === true, 'Normal contraction is counted');
  assert(res1.patientFeedback.includes('GOOD JOB'), 'Normal feedback is positive');

  // TEST 2: Abdominal compensation
  const compReading: BiofeedbackReading = {
    pelvic_activity: 75,
    abdominal_activity: 58, // Engaged stomach
    signal_quality: 'GOOD',
    timestamp: Date.now(),
  };
  const res2 = validateRepetition(compReading, 65, 5, 5);
  assert(res2.result === 'COMPENSATED', 'Abdominal pushing returns COMPENSATED');
  assert(res2.isCounted === false, 'Compensated rep is NOT counted');
  assert(res2.patientFeedback.includes('relax your stomach'), 'Patient-friendly stomach message');

  // TEST 3: Weak contraction
  const weakReading: BiofeedbackReading = {
    pelvic_activity: 40, // Below 65% target
    abdominal_activity: 12,
    signal_quality: 'GOOD',
    timestamp: Date.now(),
  };
  const res3 = validateRepetition(weakReading, 65, 5, 5);
  assert(res3.result === 'MISS', 'Pelvic below target returns MISS');
  assert(res3.isCounted === false, 'Missed rep is NOT counted');
  assert(res3.patientFeedback.includes('tightening a little more'), 'Gentle encouragement feedback');

  // TEST 4: Poor signal / Artifact
  const badSignalReading: BiofeedbackReading = {
    pelvic_activity: 20,
    abdominal_activity: 8,
    signal_quality: 'POOR',
    timestamp: Date.now(),
  };
  const res4 = validateRepetition(badSignalReading, 65, 5, 5);
  assert(res4.result === 'INVALID', 'Poor signal returns INVALID');
  assert(res4.patientFeedback.includes('check your sensor'), 'Clear sensor guidance');

  // TEST 5: Adaptive Training - 3 Consecutive OKs increases target by 5%
  let adaptiveRes = evaluateAdaptiveTarget('OK', 0, 0, 65);
  assert(!adaptiveRes.hasUpdated && adaptiveRes.consecutiveSuccess === 1, 'Rep 1 OK keeps target 65%');
  adaptiveRes = evaluateAdaptiveTarget('OK', adaptiveRes.consecutiveSuccess, 0, 65);
  assert(!adaptiveRes.hasUpdated && adaptiveRes.consecutiveSuccess === 2, 'Rep 2 OK keeps target 65%');
  adaptiveRes = evaluateAdaptiveTarget('OK', adaptiveRes.consecutiveSuccess, 0, 65);
  assert(
    adaptiveRes.hasUpdated && adaptiveRes.newTarget === 70,
    'Rep 3 OK increases target from 65% to 70%'
  );
  assert(adaptiveRes.consecutiveSuccess === 0, 'Consecutive success counter resets after increase');

  // TEST 6: Adaptive Training - 2 Consecutive Fails decreases target by 5%
  let failAdaptive = evaluateAdaptiveTarget('MISS', 0, 0, 70);
  assert(!failAdaptive.hasUpdated && failAdaptive.consecutiveFails === 1, 'Rep 1 Fail keeps target 70%');
  failAdaptive = evaluateAdaptiveTarget('COMPENSATED', 0, failAdaptive.consecutiveFails, 70);
  assert(
    failAdaptive.hasUpdated && failAdaptive.newTarget === 65,
    'Rep 2 Fail decreases target from 70% to 65%'
  );

  // TEST 7: Adaptive Training - INVALID does not alter target
  const invalidAdaptive = evaluateAdaptiveTarget('INVALID', 2, 1, 65);
  assert(!invalidAdaptive.hasUpdated && invalidAdaptive.newTarget === 65, 'INVALID rep does not adapt target');

  // TEST 8: Real-time dynamic feedback
  const realTimeOK = getRealtimeFeedback(normalReading, 65);
  assert(realTimeOK.status === 'ok' && realTimeOK.message.includes('Great'), 'Realtime status OK');

  const realTimeComp = getRealtimeFeedback(compReading, 65);
  assert(realTimeComp.status === 'danger' && realTimeComp.message.includes('stomach'), 'Realtime compensation danger');

  console.log(`\n====================================================`);
  console.log(`🏁 TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
