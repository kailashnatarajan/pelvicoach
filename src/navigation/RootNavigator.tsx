import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { AuthNavigator } from './AuthNavigator';
import { ClinicianNavigator } from './ClinicianNavigator';
import { PatientNavigator } from './PatientNavigator';

export const RootNavigator = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.brandingBox}>
          <Text style={styles.logoText}>PelviCoach</Text>
          <Text style={styles.tagline}>Simple. Guided. Personalized.</Text>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 28 }} />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : role === 'clinician' ? (
        <ClinicianNavigator />
      ) : (
        <PatientNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  brandingBox: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 6,
  },
});
