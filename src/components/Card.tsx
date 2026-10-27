import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors } from '../theme/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'warning' | 'danger';
}

export const Card: React.FC<CardProps> = ({ children, variant = 'default', style, ...rest }) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'highlight':
        return Colors.primary;
      case 'warning':
        return Colors.warning;
      case 'danger':
        return Colors.danger;
      default:
        return Colors.borderLight;
    }
  };

  return (
    <View style={[styles.card, { borderColor: getBorderColor() }, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 8,
  },
});
