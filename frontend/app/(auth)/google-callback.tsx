import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

/**
 * This screen handles the deep link: moneymind://auth/callback?token=JWT&user=JSON
 * Google redirects here after OAuth sign-in. We extract the JWT and user payload,
 * persist them via the auth store, then navigate into the app.
 */
export default function GoogleCallbackScreen() {
  const { token, user } = useLocalSearchParams<{ token: string; user: string }>();
  const { loginWithGoogle } = useAuthStore();

  useEffect(() => {
    const finish = async () => {
      if (!token || !user) {
        // Missing params — fall back to login
        router.replace('/(auth)/login');
        return;
      }
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));
        await loginWithGoogle(token, parsedUser);
        router.replace('/(tabs)');
      } catch {
        router.replace('/(auth)/login');
      }
    };
    finish();
  }, [token, user]);

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
