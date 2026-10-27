import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DEFAULT_EXERCISES } from '../../constants/exercises';
import { DatabaseService } from '../../services/dbService';
import { Colors } from '../../theme/colors';
import { Exercise } from '../../types';

interface ExerciseLibraryScreenProps {
  navigation: any;
}

export const ExerciseLibraryScreen: React.FC<ExerciseLibraryScreenProps> = ({ navigation }) => {
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const list = await DatabaseService.getExercises();
      setExercises(list);
    } catch (e) {
      console.warn('Error loading exercises:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exercise Library</Text>
          <Text style={styles.headerSub}>Select an exercise recommended for your program</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          exercises.map((item) => (
            <Card key={item.id} style={styles.exerciseCard}>
              <View style={styles.metaRow}>
                <View style={styles.pillBadge}>
                  <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.pillText}>{item.duration}</Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="fitness-outline" size={16} color="#B45309" />
                  <Text style={[styles.pillText, { color: '#B45309' }]}>{item.difficulty}</Text>
                </View>
              </View>

              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.watchVideoBtn}
                  onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
                  accessibilityLabel={`Watch video for ${item.name}`}
                >
                  <Ionicons name="videocam-outline" size={20} color={Colors.primaryDark} />
                  <Text style={styles.watchVideoText}>WATCH VIDEO</Text>
                </TouchableOpacity>

                <PrimaryButton
                  title="START"
                  size="normal"
                  icon={<Ionicons name="play" size={18} color="#FFFFFF" />}
                  onPress={() => navigation.navigate('Training', { exercise: item })}
                  style={styles.startBtn}
                />
              </View>
            </Card>
          ))
        )}
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
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  exerciseCard: {
    padding: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 17,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  watchVideoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    minHeight: 52,
  },
  watchVideoText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  startBtn: {
    flex: 1,
    minHeight: 52,
  },
});
