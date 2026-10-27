import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '../theme/colors';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'normal' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  variant = 'primary',
  size = 'large',
  icon,
  loading = false,
  disabled,
  style,
  ...rest
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#94A3B8';
    switch (variant) {
      case 'primary':
        return Colors.primaryDark;
      case 'secondary':
        return Colors.secondary;
      case 'outline':
        return 'transparent';
      case 'danger':
        return Colors.danger;
      case 'success':
        return Colors.success;
      default:
        return Colors.primaryDark;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return disabled ? '#94A3B8' : Colors.primaryDark;
    }
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.button,
        size === 'large' ? styles.largeButton : styles.normalButton,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              size === 'large' ? styles.largeText : styles.normalText,
              { color: getTextColor() },
              icon ? { marginLeft: 10 } : null,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  largeButton: {
    minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  normalButton: {
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  outlineBorder: {
    borderWidth: 2,
    borderColor: Colors.primaryDark,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  largeText: {
    fontSize: 20,
  },
  normalText: {
    fontSize: 18,
  },
});
