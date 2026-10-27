import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { demoSimulator } from '../services/demoSimulator';
import { Colors } from '../theme/colors';
import { DemoScenario } from '../types';

interface DemoControlPanelProps {
  onScenarioChange?: (scenario: DemoScenario) => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({ onScenarioChange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>('NORMAL');

  const scenarios: { id: DemoScenario; label: string; icon: any; color: string }[] = [
    { id: 'NORMAL', label: '✓ Correct Exercise', icon: 'checkmark-circle', color: Colors.success },
    { id: 'COMPENSATION', label: '⚠ Abdominal Compensation', icon: 'warning', color: Colors.danger },
    { id: 'WEAK', label: '↓ Weak Contraction', icon: 'arrow-down-circle', color: Colors.warning },
    { id: 'POOR_SIGNAL', label: '⚠ Poor Signal', icon: 'cellular-outline', color: '#64748B' },
    { id: 'INTERFERENCE', label: '⚡ Electrical Interference', icon: 'flash', color: '#9333EA' },
  ];

  const handleSelect = (scenario: DemoScenario) => {
    setActiveScenario(scenario);
    demoSimulator.setScenario(scenario);
    if (onScenarioChange) {
      onScenarioChange(scenario);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Floating Toggle Pill */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.togglePill}
        accessibilityLabel="Toggle Hackathon Demo Simulator Controls"
      >
        <Ionicons name="hardware-chip-outline" size={20} color="#FFFFFF" />
        <Text style={styles.togglePillText}>
          {isExpanded ? 'Hide Demo Controls' : '🎮 Demo Controls'}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-down' : 'chevron-up'}
          size={18}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* Expanded Control Drawer */}
      {isExpanded && (
        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>Hackathon Simulation Controls</Text>
          <Text style={styles.panelSubtitle}>
            Tap a scenario to instantly trigger biofeedback responses:
          </Text>

          <View style={styles.buttonList}>
            {scenarios.map((item) => {
              const isSelected = activeScenario === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => handleSelect(item.id)}
                  style={[
                    styles.scenarioButton,
                    isSelected && { backgroundColor: item.color, borderColor: item.color },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : item.color}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.scenarioButtonText,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
    zIndex: 999,
  },
  togglePill: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  togglePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginHorizontal: 8,
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  panelSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: 2,
  },
  buttonList: {
    gap: 8,
  },
  scenarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  scenarioButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
