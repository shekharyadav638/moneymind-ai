import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTransactionStore } from '../../store/transactionStore';
import { useAuthStore } from '../../store/authStore';
import { emailAPI } from '../../services/api';
import { TransactionCard } from '../../components/cards/TransactionCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { Colors } from '../../constants/colors';
import { TRANSACTION_CATEGORIES } from '../../constants/categories';
import { LinearGradient } from 'expo-linear-gradient';

const FILTER_CATEGORIES = ['All', ...TRANSACTION_CATEGORIES.map((c) => c.label)];

export default function TransactionsScreen() {
  const { transactions, isLoading, fetchTransactions, deleteTransaction } = useTransactionStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<'all' | 'debit' | 'credit'>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncCount, setSyncCount] = useState(0);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { fetchTransactions({ limit: 500 }); }, []);
  const onRefresh = useCallback(async () => { await fetchTransactions({ limit: 500 }); }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setSyncing(false);
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('Starting sync...');
    const prevCount = transactions.length;
    let pollAttempts = 0;
    const MAX_POLLS = 24; // 24 × 5s = 2 min max

    try {
      await emailAPI.syncEmails();
      setSyncMessage('Processing emails in background...');
    } catch (err: any) {
      setSyncMessage('');
      Alert.alert('Sync Failed', err.message || 'Error syncing emails');
      setSyncing(false);
      return;
    }

    // Poll every 5s until we get new transactions or hit the limit
    pollRef.current = setInterval(async () => {
      pollAttempts++;
      await fetchTransactions({ limit: 500 });
      const newCount = useTransactionStore.getState().transactions.length;
      setSyncCount(newCount);
      if (newCount > prevCount) {
        setSyncMessage(`✅ Synced ${newCount - prevCount} new transaction${newCount - prevCount === 1 ? '' : 's'}!`);
        setTimeout(stopPolling, 2000);
        return;
      }
      setSyncMessage(`Checking for new transactions... (${pollAttempts * 5}s)`);
      if (pollAttempts >= MAX_POLLS) {
        setSyncMessage('Sync complete — no new transactions found.');
        setTimeout(stopPolling, 2000);
      }
    }, 5000);
  };

  const handleDelete = (id: string, merchant: string) => {
    Alert.alert(
      'Delete Transaction',
      `Remove "${merchant}" transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  // Apply filters
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    const matchesMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;

    const matchesSearch =
      !search ||
      t.merchant.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    return matchesMonth && matchesSearch && matchesCategory && matchesType;
  });

  const totalSpend = filtered.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalCredit = filtered.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {user?.gmailConnected && (
            <TouchableOpacity onPress={handleSync} disabled={syncing} style={styles.addBtn}>
              <LinearGradient colors={['rgba(108,99,255,0.1)', 'rgba(78,205,196,0.1)']} style={[styles.addBtnGrad, { borderWidth: 1, borderColor: Colors.primary }]}>
                {syncing ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={[styles.addBtnText, { color: Colors.primary }]}>↻ Sync All</Text>}
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push('/add-transaction')}
            style={styles.addBtn}
          >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.addBtnGrad}>
              <Text style={styles.addBtnText}>+ New</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Banner */}
      {syncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.syncBannerText}>{syncMessage}</Text>
        </View>
      )}

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryItem, { borderColor: 'rgba(255,107,107,0.3)' }]}>
          <Text style={styles.summaryLabel}>Debits</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            ₹{totalSpend.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.summaryItem, { borderColor: 'rgba(0,212,170,0.3)' }]}>
          <Text style={styles.summaryLabel}>Credits</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            ₹{totalCredit.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.summaryItem, { borderColor: 'rgba(108,99,255,0.3)' }]}>
          <Text style={styles.summaryLabel}>Count</Text>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.text.muted}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: Colors.text.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters: Type + Category combined */}
      <View style={styles.filtersSection}>
        {/* Type Segment */}
        <View style={styles.typeSegment}>
          {(['all', 'debit', 'credit'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              style={[styles.segChip, selectedType === type && styles.segChipActive]}
            >
              <Text style={[styles.segChipText, selectedType === type && styles.segChipTextActive]}>
                {type === 'all' ? 'All' : type === 'debit' ? '💸 Debits' : '💰 Credits'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category horizontal scroll */}
        <FlatList
          horizontal
          data={TRANSACTION_CATEGORIES}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(selectedCategory === item.label ? 'All' : item.label)}
              style={[
                styles.categoryChip,
                selectedCategory === item.label && styles.categoryChipActive,
              ]}
            >
              <Text style={styles.categoryEmoji}>{item.icon}</Text>
              <Text style={[styles.categoryChipText, selectedCategory === item.label && styles.categoryChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.categoryList}
        />
      </View>

      {/* Transaction List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            onDelete={() => handleDelete(item._id, item.merchant)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              {search ? 'No matching transactions' : 'No transactions yet'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { color: Colors.text.primary, fontSize: 26, fontWeight: '800' },
  addBtn: { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryLabel: { color: Colors.text.muted, fontSize: 11, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
    height: 46,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 14 },
  filtersSection: {
    marginBottom: 4,
  },
  typeSegment: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  segChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(108,99,255,0.15)',
  },
  segChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segChipText: { color: Colors.text.muted, fontSize: 13, fontWeight: '500' },
  segChipTextActive: { color: '#FFF', fontWeight: '700' },
  categoryList: { maxHeight: 48 },
  categoryScroll: { paddingHorizontal: 20, gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
    gap: 4,
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryEmoji: { fontSize: 13 },
  categoryChipText: { color: Colors.text.muted, fontSize: 12 },
  categoryChipTextActive: { color: '#FFF', fontWeight: '700' },
  listContent: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: Colors.text.muted, fontSize: 15 },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  syncBannerText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
});
