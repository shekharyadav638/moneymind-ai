import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface InsightCardProps {
  insight: {
    type: 'warning' | 'positive' | 'tip' | 'alert';
    title: string;
    message: string;
    icon?: string;
  };
}

const typeConfig = {
  warning: { bg: 'rgba(255,179,71,0.1)', border: 'rgba(255,179,71,0.3)', color: Colors.warning },
  positive: { bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.3)', color: Colors.success },
  tip: { bg: 'rgba(108,99,255,0.1)', border: 'rgba(108,99,255,0.3)', color: Colors.primary },
  alert: { bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.3)', color: Colors.error },
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const config = typeConfig[insight.type] || typeConfig.tip;

  return (
    <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.header}>
        {insight.icon && <Text style={styles.icon}>{insight.icon}</Text>}
        <Text style={[styles.title, { color: config.color }]}>{insight.title}</Text>
      </View>
      <Text style={styles.message}>{insight.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  message: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
