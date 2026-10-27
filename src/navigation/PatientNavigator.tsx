import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ExerciseDetailScreen } from '../screens/patient/ExerciseDetailScreen';
import { ExerciseLibraryScreen } from '../screens/patient/ExerciseLibraryScreen';
import { PatientHomeScreen } from '../screens/patient/PatientHomeScreen';
import { PatientProgressScreen } from '../screens/patient/PatientProgressScreen';
import { PatientProfileScreen } from '../screens/patient/PatientProfileScreen';
import { SessionSummaryScreen } from '../screens/patient/SessionSummaryScreen';
import { TrainingScreen } from '../screens/patient/TrainingScreen';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack for Exercise Library -> Detail
const ExerciseStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Library" component={ExerciseLibraryScreen} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
  </Stack.Navigator>
);

// Patient Bottom Tabs: Home, Exercises, Progress, Profile
const PatientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: Colors.primaryDark,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: {
        height: 72,
        paddingBottom: 10,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1.5,
        borderTopColor: Colors.borderLight,
      },
      tabBarLabelStyle: {
        fontSize: 14,
        fontWeight: '800',
      },
      tabBarIcon: ({ color, focused, size }) => {
        let iconName: any = 'home';
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Exercises') {
          iconName = focused ? 'fitness' : 'fitness-outline';
        } else if (route.name === 'Progress') {
          iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={28} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={PatientHomeScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="Exercises" component={ExerciseStack} options={{ tabBarLabel: 'Exercises' }} />
    <Tab.Screen name="Progress" component={PatientProgressScreen} options={{ tabBarLabel: 'Progress' }} />
    <Tab.Screen name="Profile" component={PatientProfileScreen} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

// Root Patient Stack to allow full-screen distraction-free Training & Summary
export const PatientNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={PatientTabs} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
    <Stack.Screen
      name="Training"
      component={TrainingScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen
      name="SessionSummary"
      component={SessionSummaryScreen}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);
