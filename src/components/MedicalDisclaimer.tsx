import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';

export const MedicalDisclaimer: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
        <Text style={styles.heading}>Prototype & Educational Disclaimer</Text>
      </View>
      <Text style={styles.disclaimerText}>
        PelviCoach is a prototype developed for demonstration and research purposes. It is not a
        clinically validated diagnostic or treatment device. Clinical use requires appropriate
        validation and qualified healthcare supervision.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
