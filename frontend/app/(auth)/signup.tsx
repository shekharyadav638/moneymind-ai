import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { GradientButton } from '../../components/ui/GradientButton';
import { StyledInput } from '../../components/ui/StyledInput';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isLoading, error, clearError } = useAuthStore();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    try {
      await signup(
        name.trim(),
        email.trim().toLowerCase(),
        password,
        monthlyIncome ? parseFloat(monthlyIncome.replace(/,/g, '')) : 0
      );
      router.replace('/(tabs)');
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your financial journey today 🚀</Text>
          </View>

          <View style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.errorClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <StyledInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder="John Doe"
            />
            <StyledInput
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
            <StyledInput
              label="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Min. 6 characters"
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />
            <StyledInput
              label="Monthly Income (Optional)"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
              placeholder="50000"
              leftIcon={<Text style={{ color: Colors.text.muted, fontSize: 15 }}>₹</Text>}
            />

            <Text style={styles.hint}>
              💡 Adding your income helps MoneyMind AI give better savings insights.
            </Text>

            <GradientButton
              title="Create Account"
              onPress={handleSignup}
              isLoading={isLoading}
              size="large"
              style={styles.signupButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backButton: { paddingTop: 12, paddingBottom: 8 },
  backText: { color: Colors.text.secondary, fontSize: 15 },
  titleSection: { marginBottom: 28 },
  title: { color: Colors.text.primary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.text.muted, fontSize: 15, marginTop: 6 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  errorClose: { color: Colors.error, fontSize: 14, marginLeft: 8 },
  hint: {
    color: Colors.text.muted,
    fontSize: 12,
    marginBottom: 20,
    lineHeight: 18,
    backgroundColor: 'rgba(108,99,255,0.07)',
    padding: 12,
    borderRadius: 10,
  },
  signupButton: { marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: Colors.text.muted, fontSize: 15 },
  loginLink: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  terms: { color: Colors.text.muted, fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
