import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useDeepLinkStore } from '@/store/deepLinkStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AppLayout() {
  const { session, isLoading } = useAuthStore();
  const deepLinkScreen = useDeepLinkStore((s) => s.screen);

  // Hay un flujo de verify-email en curso: no renderizar las tabs con esa
  // sesión, que no es un login real. Mismo criterio que la guardia de
  // app/index.tsx.
  if (isLoading || deepLinkScreen) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
