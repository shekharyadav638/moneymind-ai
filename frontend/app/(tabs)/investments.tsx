import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useInvestmentStore } from '../../store/investmentStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors } from '../../constants/colors';
import { INVESTMENT_TYPES, ASSET_CLASSES } from '../../constants/categories';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Path, Circle } from 'react-native-svg';
import api from '../../services/api';

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const rad = ((angle - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx: number, cy: number, r: number, start: number, end: number) => {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const largeArc = end - start <= 180 ? '0' : '1';
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y} L ${cx} ${cy} Z`;
};

export default function InvestmentsScreen() {
  const { investments, summary, isLoading, fetchInvestments, deleteInvestment, updateInvestment } = useInvestmentStore();
  
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingInvestment, setEditingInvestment] = React.useState<any>(null);
  const [editUnits, setEditUnits] = React.useState('');
  const [editAmount, setEditAmount] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleLongPress = (inv: any) => {
    Alert.alert(
      'Investment Options',
      `What would you like to do with ${inv.name}?`,
      [
        { text: 'Edit Units', onPress: () => openEditModal(inv) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(inv._id, inv.name) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Investment', `Remove "${name}" from your portfolio?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', onPress: () => deleteInvestment(id) },
    ]);
  };

  const openEditModal = (inv: any) => {
    setEditingInvestment(inv);
    setEditUnits(inv.units ? inv.units.toString() : '');
    setEditAmount(inv.amountInvested ? inv.amountInvested.toString() : '');
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingInvestment) return;
    try {
      const parsedUnits = parseFloat(editUnits);
      const parsedAmount = parseFloat(editAmount);
      await updateInvestment(editingInvestment._id, {
        units: parsedUnits || 0,
        amountInvested: parsedAmount || 0,
      });
      setEditModalVisible(false);
      fetchInvestments(); // Re-fetch to get latest portfolio percentages
    } catch (err) {
      Alert.alert('Error', 'Failed to update investment details.');
    }
  };

  const [refreshingPrices, setRefreshingPrices] = React.useState(false);

  const handleRefreshPrices = async () => {
    setRefreshingPrices(true);
    try {
      const response: any = await api.post('/investments/refresh-prices');
      Alert.alert('Prices Updated', response.data?.message || 'Successfully updated live market prices.');
      fetchInvestments(); // re-fetch the new data
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update prices.');
    } finally {
      setRefreshingPrices(false);
    }
  };

  // Build pie chart by investment type (more meaningful since most are 'equity' class)
  const TYPE_COLORS: Record<string, string> = {
    stock: '#6C63FF',
    mutual_fund: '#00D4AA',
    sip: '#4ECDC4',
    fd: '#FFB347',
    ppf: '#FF85A2',
    gold: '#FFD700',
    real_estate: '#FF6B6B',
    crypto: '#F8C471',
    other: '#AEB6BF',
  };
  const chartData = summary?.portfolioByType || [];
  const totalValue = chartData.reduce((s: number, d: any) => s + (d.currentValue || d.totalInvested), 0) || 1;
  let angle = 0;
  const slices = chartData.map((d: any) => {
    const val = d.currentValue || d.totalInvested;
    const sliceAngle = (val / totalValue) * 360;
    const isFull = sliceAngle >= 359.99;
    const path = isFull ? null : arcPath(60, 60, 50, angle, angle + sliceAngle);
    const color = TYPE_COLORS[d._id] || Colors.primary;
    const pct = ((val / totalValue) * 100).toFixed(0);
    angle += sliceAngle;
    return { path, color, d, label: d._id, isFull, pct };
  });


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchInvestments} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Investments</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleRefreshPrices} disabled={refreshingPrices} style={styles.addBtn}>
              <LinearGradient colors={['rgba(108,99,255,0.1)', 'rgba(78,205,196,0.1)']} style={[styles.addBtnGrad, { borderWidth: 1, borderColor: Colors.primary }]}>
                <Text style={[styles.addBtnText, { color: Colors.primary }]}>
                  {refreshingPrices ? '↻...' : '↻ Prices'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/add-investment')}
              style={styles.addBtn}
            >
              <LinearGradient colors={[Colors.success, '#00B890']} style={styles.addBtnGrad}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Portfolio Summary */}
        {summary && summary.totalInvested > 0 ? (
          <LinearGradient
            colors={['rgba(0,212,170,0.2)', 'rgba(0,212,170,0.05)']}
            style={styles.summaryCard}
          >
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Portfolio Value</Text>
                <Text style={styles.summaryValue}>
                  ₹{summary.currentValue.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.returnBadge}>
                <Text style={[
                  styles.returnText,
                  { color: summary.totalReturns >= 0 ? Colors.success : Colors.error }
                ]}>
                  {summary.totalReturns >= 0 ? '▲' : '▼'} {Math.abs(summary.returnsPercent).toFixed(2)}%
                </Text>
              </View>
            </View>
            <View style={styles.summaryMeta}>
              <Text style={styles.summaryMetaText}>
                Invested: ₹{summary.totalInvested.toLocaleString('en-IN')}
              </Text>
              <Text style={[
                styles.summaryMetaText,
                { color: summary.totalReturns >= 0 ? Colors.success : Colors.error }
              ]}>
                {summary.totalReturns >= 0 ? '+' : ''}₹{summary.totalReturns.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Asset Allocation Chart */}
            {slices.length > 0 && (
              <View style={styles.allocContainer}>
                <Svg width={120} height={120}>
                  <G>
                    {slices.map((s, i) =>
                      s.isFull ? (
                        // Full circle for 100% single-category case (SVG arc can't handle 360°)
                        <Circle key={i} cx={60} cy={60} r={50} fill={s.color} />
                      ) : (
                        <Path key={i} d={s.path!} fill={s.color} />
                      )
                    )}
                    {/* Donut hole - use app background color for clean cutout effect */}
                    <Circle cx={60} cy={60} r={28} fill={Colors.background} />
                  </G>
                </Svg>
                <View style={styles.allocLegend}>
                                  {slices.map((s, i) => (
                    <View key={i} style={styles.allocItem}>
                      <View style={[styles.allocDot, { backgroundColor: s.color }]} />
                      <Text style={styles.allocLabel}>
                        {s.label === 'mutual_fund' ? 'Mutual Fund' : s.label === 'real_estate' ? 'Real Estate' : s.label.charAt(0).toUpperCase() + s.label.slice(1)}
                      </Text>
                      <Text style={[styles.allocPercent, { color: s.color }]}>
                        {s.pct}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </LinearGradient>
        ) : (
          <GlassCard style={styles.emptyPortfolio}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyTitle}>No Investments Yet</Text>
            <Text style={styles.emptySubtext}>Add your first investment to track your portfolio</Text>
          </GlassCard>
        )}

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {[
              { label: 'All', value: 'all' },
              { label: '📊 Stocks', value: 'stock' },
              { label: '🏦 Mutual Funds', value: 'mutual_fund' },
              { label: '🔄 SIP', value: 'sip' },
              { label: '🔒 FD', value: 'fd' },
            ].map((f) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => setActiveFilter(f.value)}
                style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, activeFilter === f.value && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Investment List */}
        <Text style={styles.sectionTitle}>Your Holdings</Text>
        {investments
          .filter(inv => activeFilter === 'all' || inv.type === activeFilter)
          .map((inv) => {
          const typeInfo = INVESTMENT_TYPES.find((t) => t.value === inv.type);
          const isProfit = inv.absoluteReturn >= 0;
          return (
            <TouchableOpacity key={inv._id} activeOpacity={0.8} delayLongPress={400} onLongPress={() => handleLongPress(inv)}>
              <GlassCard style={styles.investCard}>
                <View style={styles.investRow}>
                  <View style={styles.investLeft}>
                    <View style={styles.investIcon}>
                      <Text style={{ fontSize: 22 }}>{typeInfo?.icon || '📊'}</Text>
                    </View>
                    <View style={styles.investInfo}>
                      <Text style={styles.investName} numberOfLines={1}>{inv.name}</Text>
                      <Text style={styles.investType}>
                        {typeInfo?.label || inv.type} · {inv.assetClass}
                      </Text>
                      {inv.ticker && <Text style={styles.investTicker}>{inv.ticker}</Text>}
                    </View>
                  </View>
                  <View style={styles.investRight}>
                    <Text style={styles.currentValue} numberOfLines={1}>
                      ₹{(inv.currentValue || inv.amountInvested).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.returnPct, { color: isProfit ? Colors.success : Colors.error }]}>
                      {isProfit ? '▲' : '▼'} {Math.abs(inv.returns || 0).toFixed(2)}%
                    </Text>
                    <Text style={styles.invested}>
                      Inv: ₹{inv.amountInvested.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editingInvestment?.name}</Text>
            
            <Text style={styles.modalLabel}>Amount Invested (₹)</Text>
            <View style={styles.modalInputWrapper}>
              <Text style={styles.modalCurrency}>₹</Text>
              <TextInput
                style={styles.modalInput}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.text.muted}
              />
            </View>

            <Text style={styles.modalLabel}>Number of Units</Text>
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                value={editUnits}
                onChangeText={setEditUnits}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.text.muted}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  title: { color: Colors.text.primary, fontSize: 26, fontWeight: '800' },
  addBtn: { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.2)',
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  summaryLabel: { color: Colors.text.muted, fontSize: 13, marginBottom: 4 },
  summaryValue: { color: Colors.text.primary, fontSize: 28, fontWeight: '800' },
  returnBadge: {
    backgroundColor: 'rgba(0,212,170,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  returnText: { fontSize: 14, fontWeight: '700' },
  summaryMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryMetaText: { color: Colors.text.muted, fontSize: 13 },
  allocContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  allocLegend: { flex: 1, gap: 8 },
  allocItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allocDot: { width: 10, height: 10, borderRadius: 5 },
  allocLabel: { flex: 1, color: Colors.text.secondary, fontSize: 13, textTransform: 'capitalize' },
  allocPercent: { color: Colors.text.primary, fontSize: 13, fontWeight: '700' },
  emptyPortfolio: {
    marginHorizontal: 20,
    alignItems: 'center',
    padding: 40,
    marginBottom: 24,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtext: { color: Colors.text.muted, fontSize: 13, textAlign: 'center' },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterScroll: { marginBottom: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(108,99,255,0.18)' },
  filterChipText: { color: Colors.text.muted, fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: Colors.primary, fontWeight: '700' },
  investCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    position: 'relative',
  },
  investRow: { flexDirection: 'row', alignItems: 'center' },
  investLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  investIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  investInfo: { flex: 1 },
  investName: { color: Colors.text.primary, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  investType: { color: Colors.text.muted, fontSize: 12 },
  investTicker: { color: Colors.primary, fontSize: 11, marginTop: 2 },
  investRight: { alignItems: 'flex-end', flexShrink: 0 },
  currentValue: { color: Colors.text.primary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  returnPct: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  invested: { color: Colors.text.muted, fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalLabel: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginBottom: 8,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  modalCurrency: {
    color: Colors.text.muted,
    fontSize: 16,
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
    height: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: Colors.text.muted,
    fontWeight: '600',
    fontSize: 15,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
