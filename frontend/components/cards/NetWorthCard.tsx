import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface NetWorthCardProps {
  netWorth: number;
  bankBalance: number;
  investments: number;
  liabilities: number;
  currency?: string;
}

const formatCurrency = (amount: number, currency = 'INR') => {
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  netWorth,
  bankBalance,
  investments,
  liabilities,
  currency = 'INR',
}) => {
  return (
    <LinearGradient
      colors={['#6C63FF', '#4C44CF', '#2D2A8E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Background decoration */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Text style={styles.label}>Total Net Worth</Text>
      <Text style={styles.netWorth}>{formatCurrency(netWorth)}</Text>

      <View style={styles.divider} />

      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Bank</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(bankBalance)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Investments</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(investments)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Liabilities</Text>
          <Text style={[styles.breakdownValue, styles.liabilityText]}>
            -{formatCurrency(liabilities)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -40,
    left: -30,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  netWorth: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 18,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  breakdownValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  liabilityText: {
    color: '#FF9B9B',
  },
  separator: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
