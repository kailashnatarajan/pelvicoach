import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface CircularTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  label?: string;
  phase: 'prepare' | 'contract' | 'relax';
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  totalSeconds,
  remainingSeconds,
  label = 'SECONDS',
  phase,
}) => {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress stroke
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const getPhaseColor = () => {
    switch (phase) {
      case 'contract':
        return Colors.primary;
      case 'relax':
        return '#3B82F6'; // Gentle blue for rest
      case 'prepare':
        return Colors.warning;
      default:
        return Colors.primary;
    }
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case 'contract':
        return 'SQUEEZE & HOLD';
      case 'relax':
        return 'RELAX & BREATHE';
      case 'prepare':
        return 'GET READY';
      default:
        return 'HOLD';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.phaseTitle, { color: getPhaseColor() }]}>
        {getPhaseTitle()}
      </Text>

      <View style={styles.svgContainer}>
        <Svg width={size} height={size}>
          {/* Background Track Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.surfaceSubtle}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getPhaseColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center Countdown Display */}
        <View style={styles.innerLabelContainer}>
          <Text style={styles.countdownNumber}>{Math.max(0, remainingSeconds)}</Text>
          <Text style={styles.countdownLabel}>{label}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  svgContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.text,
  },
  countdownLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: -4,
  },
});
