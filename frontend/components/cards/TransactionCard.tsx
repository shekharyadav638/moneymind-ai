import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { TRANSACTION_CATEGORIES } from '../../constants/categories';
import { format } from 'date-fns';

interface TransactionCardProps {
  transaction: {
    _id: string;
    amount: number;
    type: 'debit' | 'credit';
    category: string;
    merchant: string;
    date: string;
    source?: string;
  };
  onPress?: () => void;
  onDelete?: () => void;
}

const formatAmount = (amount: number) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
  onDelete,
}) => {
  const category = TRANSACTION_CATEGORIES.find((c) => c.label === transaction.category);
  const icon = category?.icon || '📦';
  const color = category?.color || Colors.text.muted;
  const isCredit = transaction.type === 'credit';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.card}
    >
      {/* Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1}>
          {transaction.merchant}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.categoryBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.categoryText, { color }]}>{transaction.category}</Text>
          </View>
          <Text style={styles.date}>
            {format(new Date(transaction.date), 'dd MMM')}
          </Text>
          {transaction.source === 'email' && (
            <View style={styles.emailBadge}>
              <Text style={styles.emailBadgeText}>📧 Auto</Text>
            </View>
          )}
        </View>
      </View>

      {/* Amount */}
      <Text style={[styles.amount, isCredit ? styles.creditAmount : styles.debitAmount]}>
        {isCredit ? '+' : '-'}
        {formatAmount(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  merchant: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  emailBadge: {
    backgroundColor: 'rgba(78,205,196,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emailBadgeText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  debitAmount: {
    color: Colors.error,
  },
  creditAmount: {
    color: Colors.success,
  },
});
