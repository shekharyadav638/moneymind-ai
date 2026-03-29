import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: string[];
  intensity?: number;
  padding?: number;
  borderColor?: string;
}

/**
 * GlassCard — Glassmorphism card component
 * Used throughout the app for the modern fintech look
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  gradient = false,
  gradientColors = ['rgba(108,99,255,0.15)', 'rgba(78,205,196,0.05)'],
  intensity = 20,
  padding = 20,
  borderColor = 'rgba(108, 99, 255, 0.2)',
}) => {
  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor, padding }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, { borderColor, padding, backgroundColor: Colors.card }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
