import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

/**
 * This screen handles the deep link: moneymind://auth/callback?token=JWT&user=JSON
 * Google redirects here after OAuth sign-in. We extract the JWT and user payload,
 * persist them via the auth store, then navigate into the app.
 */
export default function GoogleCallbackScreen() {
  const params = useLocalSearchParams<{ token: string; user: string }>();
  const { loginWithGoogle } = useAuthStore();

  useEffect(() => {
    const finish = async (token: string, user: string) => {
      if (!token || !user) {
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

    // Params may arrive via Expo Router or directly via the deep link URL
    if (params.token && params.user) {
      finish(params.token, params.user);
      return;
    }

    // Fallback: parse the URL directly (handles cases where Expo Router
    // doesn't forward query params from custom-scheme deep links)
    const handleUrl = ({ url }: { url: string }) => {
      try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token') ?? '';
        const user = parsed.searchParams.get('user') ?? '';
        finish(token, user);
      } catch {
        router.replace('/(auth)/login');
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
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
