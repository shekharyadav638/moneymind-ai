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
import { useInvestmentStore } from '../store/investmentStore';
import { GradientButton } from '../components/ui/GradientButton';
import { StyledInput } from '../components/ui/StyledInput';
import { Colors } from '../constants/colors';
import { INVESTMENT_TYPES, ASSET_CLASSES } from '../constants/categories';

export default function AddInvestmentScreen() {
  const { addInvestment } = useInvestmentStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('stock');
  const [assetClass, setAssetClass] = useState('equity');
  const [amountInvested, setAmountInvested] = useState('');
  const [units, setUnits] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [sipAmount, setSipAmount] = useState('');
  const [sipFrequency, setSipFrequency] = useState('monthly');
  const [sipDeductionDay, setSipDeductionDay] = useState('1');
  const [ticker, setTicker] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSIP = type === 'sip';

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter an investment name.');
      return;
    }
    if (type === 'stock' && (!units || !buyPrice || parseFloat(units) <= 0 || parseFloat(buyPrice) <= 0)) {
      Alert.alert('Invalid Input', 'Please enter valid number of shares and average buy price.');
      return;
    }
    if (type !== 'stock' && (!amountInvested || parseFloat(amountInvested) <= 0)) {
      Alert.alert('Invalid Amount', 'Please enter the amount invested.');
      return;
    }

    setIsLoading(true);
    try {
      let finalAmount = 0;
      let finalUnits = units ? parseFloat(units) : undefined;
      let finalBuyPrice = buyPrice ? parseFloat(buyPrice) : undefined;

      if (type === 'stock') {
        finalAmount = (finalUnits || 0) * (finalBuyPrice || 0);
      } else {
        const parsedAmount = parseFloat(amountInvested.replace(/,/g, ''));
        finalAmount = parsedAmount;
        if (finalUnits && finalUnits > 0) {
          finalBuyPrice = finalAmount / finalUnits;
        }
      }

      await addInvestment({
        name: name.trim(),
        type,
        assetClass,
        amountInvested: finalAmount,
        units: finalUnits,
        buyPrice: finalBuyPrice,
        sipAmount: sipAmount ? parseFloat(sipAmount) : undefined,
        sipFrequency: isSIP ? (sipFrequency as any) : undefined,
        sipDeductionDay: isSIP && sipDeductionDay ? parseInt(sipDeductionDay) : undefined,
        exchange: type === 'stock' ? exchange : undefined,
        ticker: ticker || undefined,
        notes: notes || undefined,
      } as any);

      Alert.alert('Success', 'Investment added to your portfolio!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add investment.');
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Investment</Text>
            <View style={{ width: 40 }} />
          </View>

          <StyledInput
            label="Investment Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Reliance Industries, SBI Bluechip Fund"
            autoCapitalize="words"
          />

          {/* Investment Type */}
          <Text style={styles.label}>Investment Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            <View style={styles.typeRow}>
              {INVESTMENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={styles.typeEmoji}>{t.icon}</Text>
                  <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Asset Class */}
          <Text style={styles.label}>Asset Class</Text>
          <View style={styles.assetRow}>
            {ASSET_CLASSES.map((a) => (
              <TouchableOpacity
                key={a.value}
                style={[
                  styles.assetChip,
                  assetClass === a.value && { borderColor: a.color, backgroundColor: `${a.color}20` },
                ]}
                onPress={() => setAssetClass(a.value)}
              >
                <Text style={[styles.assetChipText, assetClass === a.value && { color: a.color, fontWeight: '700' }]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'stock' ? (
            <>
              <StyledInput
                label="Number of Shares *"
                value={units}
                onChangeText={setUnits}
                keyboardType="numeric"
                placeholder="e.g. 10"
              />
              <StyledInput
                label="Average Buy Price per Share (₹) *"
                value={buyPrice}
                onChangeText={setBuyPrice}
                keyboardType="numeric"
                placeholder="e.g. 2450"
                leftIcon={<Text style={{ color: Colors.text.muted }}>₹</Text>}
              />
              {(parseFloat(units) > 0 && parseFloat(buyPrice) > 0) && (
                <View style={{ marginBottom: 18, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                  <Text style={{ color: Colors.text.secondary, fontSize: 13 }}>Total Computed Investment</Text>
                  <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                    ₹{(parseFloat(units) * parseFloat(buyPrice)).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <StyledInput
                label="Amount Invested (₹) *"
                value={amountInvested}
                onChangeText={setAmountInvested}
                keyboardType="numeric"
                placeholder="e.g. 10000"
                leftIcon={<Text style={{ color: Colors.text.muted }}>₹</Text>}
              />
              {type === 'mutual_fund' && (
                <StyledInput
                  label="Number of Units (Optional)"
                  value={units}
                  onChangeText={setUnits}
                  keyboardType="numeric"
                  placeholder="e.g. 145.23"
                />
              )}
            </>
          )}

          {type === 'stock' && (
            <>
              <Text style={styles.label}>Exchange</Text>
              <View style={styles.freqRow}>
                {['NSE', 'BSE'].map((ex) => (
                  <TouchableOpacity
                    key={ex}
                    style={[styles.freqChip, exchange === ex && styles.freqChipActive]}
                    onPress={() => setExchange(ex)}
                  >
                    <Text style={[styles.freqChipText, exchange === ex && styles.freqChipTextActive]}>
                      {ex}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <StyledInput
                label="Ticker Symbol (Optional)"
                value={ticker}
                onChangeText={setTicker}
                placeholder="e.g. RELIANCE, TATAMOTORS"
                autoCapitalize="characters"
              />
            </>
          )}

          {isSIP && (
            <>
              <StyledInput
                label="Monthly SIP Amount (₹)"
                value={sipAmount}
                onChangeText={setSipAmount}
                keyboardType="numeric"
                placeholder="e.g. 5000"
                leftIcon={<Text style={{ color: Colors.text.muted }}>₹</Text>}
              />
              <StyledInput
                label="Deduction Day (1-28) *"
                value={sipDeductionDay}
                onChangeText={setSipDeductionDay}
                keyboardType="numeric"
                placeholder="e.g. 5"
              />
              <Text style={styles.label}>SIP Frequency</Text>
              <View style={styles.freqRow}>
                {['monthly', 'weekly', 'quarterly'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqChip, sipFrequency === f && styles.freqChipActive]}
                    onPress={() => setSipFrequency(f)}
                  >
                    <Text style={[styles.freqChipText, sipFrequency === f && styles.freqChipTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <StyledInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes about this investment"
            multiline
          />

          <GradientButton
            title="Add to Portfolio"
            onPress={handleSubmit}
            isLoading={isLoading}
            size="large"
            colors={[Colors.success, '#00B890']}
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
  label: { color: Colors.text.secondary, fontSize: 14, fontWeight: '500', marginBottom: 10 },
  typeScroll: { marginBottom: 18 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(108,99,255,0.15)' },
  typeEmoji: { fontSize: 14 },
  typeChipText: { color: Colors.text.muted, fontSize: 12 },
  typeChipTextActive: { color: Colors.primary, fontWeight: '700' },
  assetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  assetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  assetChipText: { color: Colors.text.muted, fontSize: 12 },
  freqRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  freqChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  freqChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(108,99,255,0.15)' },
  freqChipText: { color: Colors.text.muted, fontSize: 12 },
  freqChipTextActive: { color: Colors.primary, fontWeight: '700' },
  submitBtn: { marginTop: 8 },
});
