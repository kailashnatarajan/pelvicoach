import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';

interface MuscleActivityGaugeProps {
  pelvicActivity: number;     // 0 - 100%
  abdominalActivity: number;  // 0 - 100%
  targetPercentage: number;   // e.g. 65%
  isCompensating: boolean;
}

export const MuscleActivityGauge: React.FC<MuscleActivityGaugeProps> = ({
  pelvicActivity,
  abdominalActivity,
  targetPercentage,
  isCompensating,
}) => {
  const boundedPelvic = Math.min(100, Math.max(0, pelvicActivity));
  const boundedTarget = Math.min(100, Math.max(0, targetPercentage));
  const reachedTarget = boundedPelvic >= boundedTarget;

  const getBarColor = () => {
    if (isCompensating) return Colors.danger;
    if (reachedTarget) return Colors.success;
    return Colors.warning;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Muscle Activity</Text>
        <Text style={[styles.percentageValue, { color: getBarColor() }]}>
          {boundedPelvic}%
        </Text>
      </View>

      {/* Primary Pelvic Activity Progress Bar */}
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${boundedPelvic}%`,
              backgroundColor: getBarColor(),
            },
          ]}
        />
        {/* Target Goal Marker Line */}
        <View style={[styles.targetMarker, { left: `${boundedTarget}%` }]}>
          <View style={styles.targetFlag}>
            <Text style={styles.targetFlagText}>{boundedTarget}%</Text>
          </View>
        </View>
      </View>

      {/* Sub-indicators for patient awareness */}
      <View style={styles.subIndicatorRow}>
        <Text style={styles.subIndicatorLabel}>Target: {boundedTarget}%</Text>
        <View style={styles.stomachStatusBadge}>
          <Text
            style={[
              styles.stomachStatusText,
              { color: isCompensating ? Colors.danger : Colors.textSecondary },
            ]}
          >
            Stomach: {isCompensating ? 'Engaged ⚠' : 'Relaxed ✓'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  percentageValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  barBackground: {
    height: 32,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 16,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
    borderRadius: 16,
  },
  targetMarker: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 4,
    backgroundColor: Colors.text,
    zIndex: 10,
    borderRadius: 2,
  },
  targetFlag: {
    position: 'absolute',
    top: -24,
    left: -18,
    backgroundColor: Colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  targetFlagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  subIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  subIndicatorLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stomachStatusBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stomachStatusText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
