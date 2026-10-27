import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ClinicianDashboardScreen } from '../screens/clinician/ClinicianDashboardScreen';
import { ClinicianPatientDetailScreen } from '../screens/clinician/ClinicianPatientDetailScreen';
import { ClinicianProfileScreen } from '../screens/clinician/ClinicianProfileScreen';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardHome" component={ClinicianDashboardScreen} />
    <Stack.Screen name="ClinicianPatientDetail" component={ClinicianPatientDetailScreen} />
  </Stack.Navigator>
);

export const ClinicianNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: Colors.primaryDark,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: {
        height: 70,
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
      tabBarIcon: ({ color, focused }) => {
        let iconName: any = 'people';
        if (route.name === 'Patients') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'ClinicianProfile') {
          iconName = focused ? 'medical' : 'medical-outline';
        }
        return <Ionicons name={iconName} size={28} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="Patients"
      component={DashboardStack}
      options={{ tabBarLabel: 'Patients' }}
    />
    <Tab.Screen
      name="ClinicianProfile"
      component={ClinicianProfileScreen}
      options={{ tabBarLabel: 'Practice Profile' }}
    />
  </Tab.Navigator>
);
