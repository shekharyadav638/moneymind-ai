import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { StyledInput } from '../../components/ui/StyledInput';
import { GradientButton } from '../../components/ui/GradientButton';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import api, { aiAPI, emailAPI } from '../../services/api';
import { InsightCard } from '../../components/cards/InsightCard';

export default function ProfileScreen() {
  const { user, logout, updateProfile, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [income, setIncome] = useState(user?.monthlyIncome?.toString() || '');
  const [bankBalance, setBankBalance] = useState(user?.bankBalance?.toString() || '');
  const [liabilities, setLiabilities] = useState(user?.liabilities?.toString() || '');
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [emailSyncing, setEmailSyncing] = useState(false);
  const [derivedBalance, setDerivedBalance] = useState<number | null>(null);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  useEffect(() => {
    // Fetch real-time computed bank balance
    const fetchBalance = async () => {
      try {
        const response: any = await api.get('/transactions/balance');
        // Axios interceptor already unwraps response.data, so response IS the server body
        if (response?.success) {
          setDerivedBalance(response.data.currentBalance);
        }
      } catch {}
    };
    fetchBalance();
  }, [user?.bankBalance, balanceRefreshKey]);

  const handleSave = async () => {
    try {
      await updateProfile({
        name,
        monthlyIncome: parseFloat(income) || 0,
        bankBalance: parseFloat(bankBalance) || 0,
        liabilities: parseFloat(liabilities) || 0,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated!');
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleGetInsights = async () => {
    setInsightsLoading(true);
    try {
      const response: any = await aiAPI.getInsights();
      setInsights(response.data);
    } catch {
      Alert.alert('Error', 'Could not get insights. Check your API key.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleEmailSync = async () => {
    if (!user?.gmailConnected) {
      try {
        const response: any = await emailAPI.getAuthUrl();
        await Linking.openURL(response.authUrl);
      } catch {
        Alert.alert('Error', 'Could not get Gmail auth URL.');
      }
      return;
    }
    setEmailSyncing(true);
    try {
      const response: any = await emailAPI.syncEmails();
      Alert.alert('Sync Status', response.message);
      setBalanceRefreshKey((k) => k + 1);
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message || 'Email sync failed.');
    } finally {
      setEmailSyncing(false);
    }
  };

  const netWorth = (user?.bankBalance || 0) - (user?.liabilities || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={['rgba(108,99,255,0.3)', 'rgba(108,99,255,0.05)']}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.netWorthBadge}>
            <Text style={styles.netWorthLabel}>Net Worth</Text>
            <Text style={styles.netWorthValue}>
              ₹{Math.abs(netWorth).toLocaleString('en-IN')}
            </Text>
          </View>
        </LinearGradient>

        {/* AI Insights Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤖 AI Insights</Text>
            <TouchableOpacity
              onPress={handleGetInsights}
              disabled={insightsLoading}
              style={styles.refreshBtn}
            >
              {insightsLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.refreshText}>Generate</Text>
              )}
            </TouchableOpacity>
          </View>

          {insights ? (
            <>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.summaryText}>{insights.summary}</Text>
              </GlassCard>
              {insights.insights?.map((ins: any, i: number) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </>
          ) : (
            <GlassCard style={styles.insightsPlaceholder}>
              <Text style={styles.insightsPlaceholderIcon}>✨</Text>
              <Text style={styles.insightsPlaceholderText}>
                Generate personalized AI insights based on your spending patterns
              </Text>
              <GradientButton
                title="Get AI Insights"
                onPress={handleGetInsights}
                isLoading={insightsLoading}
                size="small"
                style={{ marginTop: 12 }}
              />
            </GlassCard>
          )}
        </View>

        {/* Gmail Integration */}
        <GlassCard style={styles.section}>
          <View style={styles.integrationRow}>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationIcon}>📧</Text>
              <View>
                <Text style={styles.integrationTitle}>Global Smart Sync</Text>
                <Text style={styles.integrationStatus}>
                  {user?.gmailConnected ? '✅ Connected · Imports MFs, Stocks & Txns' : '⚪ Not connected'}
                </Text>
              </View>
            </View>
            <GradientButton
              title={emailSyncing ? 'Syncing...' : user?.gmailConnected ? 'Sync Portfolio' : 'Connect'}
              onPress={handleEmailSync}
              isLoading={emailSyncing}
              size="small"
              colors={user?.gmailConnected ? [Colors.success, '#00B890'] : [Colors.primary, Colors.primaryDark]}
            />
          </View>
        </GlassCard>

        {/* Edit Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💼 Financial Profile</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editBtn}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <GlassCard style={{ padding: 16 }}>
              <StyledInput label="Full Name" value={name} onChangeText={setName} />
              <StyledInput
                label="Monthly Income (₹)"
                value={income}
                onChangeText={setIncome}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: Colors.text.muted }}>₹</Text>}
              />
              <StyledInput
                label="Bank Balance (₹)"
                value={bankBalance}
                onChangeText={setBankBalance}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: Colors.text.muted }}>₹</Text>}
              />
              <StyledInput
                label="Total Liabilities (₹)"
                value={liabilities}
                onChangeText={setLiabilities}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: Colors.text.muted }}>₹</Text>}
              />
              <GradientButton title="Save Changes" onPress={handleSave} isLoading={isLoading} />
            </GlassCard>
          ) : (
            <GlassCard style={styles.profileStats}>
              {[
                { label: 'Monthly Income', value: `₹${(user?.monthlyIncome || 0).toLocaleString('en-IN')}`, icon: '💰' },
                { label: 'Bank Balance', value: `₹${(derivedBalance ?? user?.bankBalance ?? 0).toLocaleString('en-IN')}`, icon: '🏦' },
                { label: 'Liabilities', value: `₹${(user?.liabilities || 0).toLocaleString('en-IN')}`, icon: '📉' },
                { label: 'Currency', value: user?.currency || 'INR', icon: '🌐' },
              ].map((item) => (
                <View key={item.label} style={styles.profileStatRow}>
                  <Text style={styles.profileStatIcon}>{item.icon}</Text>
                  <Text style={styles.profileStatLabel}>{item.label}</Text>
                  <Text style={styles.profileStatValue}>{item.value}</Text>
                </View>
              ))}
            </GlassCard>
          )}
        </View>

        {/* Logout */}
        <GradientButton
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={{ marginHorizontal: 20, marginBottom: 40 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 100 },
  profileHeader: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 0,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108,99,255,0.2)',
  },
  avatarContainer: { marginBottom: 14 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  userName: { color: Colors.text.primary, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  userEmail: { color: Colors.text.muted, fontSize: 14, marginBottom: 16 },
  netWorthBadge: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  netWorthLabel: { color: Colors.text.muted, fontSize: 11, marginBottom: 2 },
  netWorthValue: { color: Colors.primary, fontSize: 18, fontWeight: '800' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: Colors.text.primary, fontSize: 17, fontWeight: '700' },
  refreshBtn: { padding: 4 },
  refreshText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  editBtn: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  summaryCard: { padding: 14, marginBottom: 10 },
  summaryText: { color: Colors.text.secondary, fontSize: 14, lineHeight: 21 },
  insightsPlaceholder: { padding: 24, alignItems: 'center' },
  insightsPlaceholderIcon: { fontSize: 36, marginBottom: 10 },
  insightsPlaceholderText: {
    color: Colors.text.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  integrationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  integrationInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  integrationIcon: { fontSize: 24 },
  integrationTitle: { color: Colors.text.primary, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  integrationStatus: { color: Colors.text.muted, fontSize: 12 },
  profileStats: { padding: 16, gap: 14 },
  profileStatRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileStatIcon: { fontSize: 18 },
  profileStatLabel: { flex: 1, color: Colors.text.secondary, fontSize: 14 },
  profileStatValue: { color: Colors.text.primary, fontSize: 15, fontWeight: '700' },
});
