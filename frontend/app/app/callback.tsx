import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

/**
 * Handles HTTPS App Link: https://moneymind.n8nbyshekhar.online/app/callback?token=JWT&user=JSON
 * Android opens this directly in the app (no browser) when App Links are verified.
 */
export default function AppCallbackScreen() {
  const params = useLocalSearchParams<{ token: string; user: string }>();
  const { loginWithGoogle } = useAuthStore();

  useEffect(() => {
    const finish = async () => {
      if (!params.token || !params.user) {
        router.replace('/(auth)/login');
        return;
      }
      try {
        const parsedUser = JSON.parse(decodeURIComponent(params.user));
        await loginWithGoogle(params.token, parsedUser);
        router.replace('/(tabs)');
      } catch {
        router.replace('/(auth)/login');
      }
    };
    finish();
  }, [params.token, params.user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
});
