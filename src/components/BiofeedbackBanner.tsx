import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { RepetitionResult } from '../types';

interface BiofeedbackBannerProps {
  message: string;
  result?: RepetitionResult | null;
  status?: 'ok' | 'warning' | 'danger' | 'neutral';
}

export const BiofeedbackBanner: React.FC<BiofeedbackBannerProps> = ({
  message,
  result,
  status = 'ok',
}) => {
  const getBannerConfig = () => {
    if (result === 'OK' || status === 'ok') {
      return {
        bg: Colors.successLight,
        border: Colors.success,
        text: '#14532D',
        icon: 'checkmark-circle' as const,
      };
    }
    if (result === 'COMPENSATED' || status === 'danger') {
      return {
        bg: Colors.dangerLight,
        border: Colors.danger,
        text: '#881337',
        icon: 'alert-circle' as const,
      };
    }
    if (result === 'MISS' || status === 'warning') {
      return {
        bg: Colors.warningLight,
        border: Colors.warning,
        text: '#78350F',
        icon: 'bulb-outline' as const,
      };
    }
    return {
      bg: Colors.neutralLight,
      border: Colors.neutral,
      text: '#1E293B',
      icon: 'information-circle' as const,
    };
  };

  const config = getBannerConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Ionicons name={config.icon} size={36} color={config.border} style={styles.icon} />
      <Text style={[styles.text, { color: config.text }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginVertical: 10,
    minHeight: 76,
  },
  icon: {
    marginRight: 14,
  },
  text: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
});
