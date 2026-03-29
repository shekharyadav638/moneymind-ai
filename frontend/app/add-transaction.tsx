import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTransactionStore } from '../store/transactionStore';
import { GradientButton } from '../components/ui/GradientButton';
import { StyledInput } from '../components/ui/StyledInput';
import { Colors } from '../constants/colors';
import { TRANSACTION_CATEGORIES } from '../constants/categories';

export default function AddTransactionScreen() {
  const { addTransaction } = useTransactionStore();
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Others');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount.replace(/,/g, '')),
        type,
        category,
        merchant: merchant || 'Unknown',
        description,
        date: new Date(date).toISOString(),
      });
      Alert.alert('Success', 'Transaction added!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Transaction</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'debit' && styles.typeBtnDebit]}
              onPress={() => setType('debit')}
            >
              <Text style={[styles.typeBtnText, type === 'debit' && styles.typeBtnTextActive]}>
                💸 Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'credit' && styles.typeBtnCredit]}
              onPress={() => setType('credit')}
            >
              <Text style={[styles.typeBtnText, type === 'credit' && styles.typeBtnTextActive]}>
                💰 Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <StyledInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              containerStyle={styles.amountInput}
              style={{ fontSize: 28, fontWeight: '800', textAlign: 'center' }}
            />
          </View>

          {/* Merchant / Name */}
          <StyledInput
            label="Merchant / Source"
            value={merchant}
            onChangeText={setMerchant}
            placeholder={type === 'debit' ? 'e.g. Swiggy, Amazon' : 'e.g. Employer, Freelance'}
            autoCapitalize="words"
          />

          {/* Category */}
          <Text style={styles.categoryLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {TRANSACTION_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={[
                  styles.categoryItem,
                  category === cat.label && { borderColor: cat.color, backgroundColor: `${cat.color}20` },
                ]}
                onPress={() => setCategory(cat.label)}
              >
                <Text style={styles.categoryItemIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryItemText,
                  category === cat.label && { color: cat.color, fontWeight: '700' },
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <StyledInput
            label="Note (Optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note..."
            multiline
          />

          {/* Date */}
          <StyledInput
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType={Platform.OS === 'ios' ? 'default' : 'numeric'}
          />

          <GradientButton
            title={`Add ${type === 'debit' ? 'Expense' : 'Income'}`}
            onPress={handleSubmit}
            isLoading={isLoading}
            size="large"
            colors={type === 'debit' ? [Colors.error, '#CC4444'] : [Colors.success, '#00B890']}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: Colors.text.secondary, fontSize: 16 },
  title: { color: Colors.text.primary, fontSize: 20, fontWeight: '800' },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  typeBtnDebit: { backgroundColor: 'rgba(255,107,107,0.2)' },
  typeBtnCredit: { backgroundColor: 'rgba(0,212,170,0.2)' },
  typeBtnText: { color: Colors.text.muted, fontSize: 14, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.text.primary },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  currencySymbol: { color: Colors.text.muted, fontSize: 28, fontWeight: '800' },
  amountInput: { flex: 1, marginBottom: 0 },
  categoryLabel: { color: Colors.text.secondary, fontSize: 14, fontWeight: '500', marginBottom: 10 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryItemIcon: { fontSize: 14 },
  categoryItemText: { color: Colors.text.muted, fontSize: 12 },
  submitBtn: { marginTop: 8 },
});
