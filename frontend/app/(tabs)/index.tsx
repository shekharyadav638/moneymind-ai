import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useInvestmentStore } from '../../store/investmentStore';
import { NetWorthCard } from '../../components/cards/NetWorthCard';
import { TransactionCard } from '../../components/cards/TransactionCard';
import { SpendingPieChart } from '../../components/charts/SpendingPieChart';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { summary, isSummaryLoading, fetchSummary } = useTransactionStore();
  const { summary: investSummary, fetchInvestments } = useInvestmentStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchSummary();
    fetchInvestments();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchInvestments()]);
    setRefreshing(false);
  }, []);

  const netWorth =
    (user?.bankBalance || 0) +
    (investSummary?.currentValue || 0) -
    (user?.liabilities || 0);

  const thisMonthSpend = summary?.thisMonth.spending || 0;
  const thisMonthIncome = summary?.thisMonth.income || user?.monthlyIncome || 0;
  const savingsRate = summary?.thisMonth.savingsRate || 0;

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getTimeGreeting()},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/add-transaction')}
            style={styles.addButton}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.addButtonGrad}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Net Worth Card */}
        <NetWorthCard
          netWorth={netWorth}
          bankBalance={user?.bankBalance || 0}
          investments={investSummary?.currentValue || 0}
          liabilities={user?.liabilities || 0}
        />

        {/* Monthly Stats Row */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>💸</Text>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statValue}>
              {thisMonthSpend >= 100000
                ? `₹${(thisMonthSpend / 100000).toFixed(1)}L`
                : `₹${(thisMonthSpend / 1000).toFixed(1)}K`}
            </Text>
            <Text style={styles.statSub}>This month</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {thisMonthIncome >= 100000
                ? `₹${(thisMonthIncome / 100000).toFixed(1)}L`
                : `₹${(thisMonthIncome / 1000).toFixed(1)}K`}
            </Text>
            <Text style={styles.statSub}>This month</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statLabel}>Savings</Text>
            <Text style={[styles.statValue, { color: savingsRate >= 20 ? Colors.success : Colors.warning }]}>
              {savingsRate}%
            </Text>
            <Text style={styles.statSub}>Rate</Text>
          </GlassCard>
        </View>

        {/* Spending by Category Pie Chart */}
        {summary?.thisMonth.categoryBreakdown && summary.thisMonth.categoryBreakdown.length > 0 && (
          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Spending Breakdown</Text>
              <Text style={styles.sectionSubtitle}>This month</Text>
            </View>
            <SpendingPieChart
              data={summary.thisMonth.categoryBreakdown}
              totalSpend={thisMonthSpend}
            />
          </GlassCard>
        )}

        {/* Investment Summary */}
        {investSummary && investSummary.totalInvested > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/investments')}>
            <LinearGradient
              colors={['rgba(0,212,170,0.15)', 'rgba(0,180,140,0.05)']}
              style={styles.investCard}
            >
              <View style={styles.investHeader}>
                <Text style={styles.investTitle}>📈 Portfolio</Text>
                <Text style={[
                  styles.investReturn,
                  { color: investSummary.totalReturns >= 0 ? Colors.success : Colors.error }
                ]}>
                  {investSummary.totalReturns >= 0 ? '+' : ''}
                  {investSummary.returnsPercent}%
                </Text>
              </View>
              <Text style={styles.investValue}>
                ₹{investSummary.currentValue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.investMeta}>
                Invested: ₹{investSummary.totalInvested.toLocaleString('en-IN')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>

        {isSummaryLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : summary?.recentTransactions.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add" to record your first transaction</Text>
          </GlassCard>
        ) : (
          summary?.recentTransactions.map((txn) => (
            <TransactionCard key={txn._id} transaction={txn} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  greeting: { color: Colors.text.muted, fontSize: 14 },
  userName: { color: Colors.text.primary, fontSize: 24, fontWeight: '800' },
  addButton: { borderRadius: 14, overflow: 'hidden' },
  addButtonGrad: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: { fontSize: 20, marginBottom: 2 },
  statLabel: { color: Colors.text.muted, fontSize: 11 },
  statValue: { color: Colors.text.primary, fontSize: 16, fontWeight: '800' },
  statSub: { color: Colors.text.muted, fontSize: 10 },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { color: Colors.text.muted, fontSize: 12 },
  viewAll: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  investCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.2)',
  },
  investHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  investTitle: { color: Colors.text.secondary, fontSize: 15, fontWeight: '600' },
  investReturn: { fontSize: 15, fontWeight: '700' },
  investValue: { color: Colors.text.primary, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  investMeta: { color: Colors.text.muted, fontSize: 12 },
  emptyCard: { marginHorizontal: 20, alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: Colors.text.secondary, fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: Colors.text.muted, fontSize: 13, marginTop: 4, textAlign: 'center' },
});
