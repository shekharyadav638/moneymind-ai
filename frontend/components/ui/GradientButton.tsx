import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  colors?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  colors = [Colors.primary, Colors.primaryDark],
  style,
  textStyle,
  size = 'medium',
  variant = 'primary',
}) => {
  const handlePress = async () => {
    if (disabled || isLoading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = {
    small: { height: 40, paddingHorizontal: 20, fontSize: 14 },
    medium: { height: 52, paddingHorizontal: 28, fontSize: 16 },
    large: { height: 60, paddingHorizontal: 32, fontSize: 18 },
  };

  const { height, paddingHorizontal, fontSize } = sizeStyles[size];

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isLoading}
        style={[
          styles.outlineButton,
          { height, paddingHorizontal, borderColor: Colors.primary },
          (disabled || isLoading) && styles.disabled,
          style,
        ]}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Text style={[styles.outlineText, { fontSize }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isLoading}
        style={[styles.ghostButton, { height, paddingHorizontal }, style]}
        activeOpacity={0.7}
      >
        <Text style={[styles.ghostText, { fontSize }, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
      style={[(disabled || isLoading) && styles.disabled, style]}
    >
      <LinearGradient
        colors={(disabled ? ['#4A4A6A', '#3A3A5A'] : colors) as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientButton, { height, paddingHorizontal }]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={[styles.buttonText, { fontSize }, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradientButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlineButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});
