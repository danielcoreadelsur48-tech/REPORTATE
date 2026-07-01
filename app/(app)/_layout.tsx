import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useDeepLinkStore } from '@/store/deepLinkStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AppLayout() {
  const { session, isLoading } = useAuthStore();

  useDeepLinkStore.getState().pushRaw(`[(app)/_layout] render: session=${session ? 'YES' : 'NULL'} isLoading=${isLoading}`);

  if (isLoading) {
    useDeepLinkStore.getState().pushRaw('[(app)/_layout] showing spinner');
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!session) {
    useDeepLinkStore.getState().pushRaw('[(app)/_layout] REDIRECT -> login');
    return <Redirect href="/(auth)/login" />;
  }

  useDeepLinkStore.getState().pushRaw('[(app)/_layout] rendering Stack (tabs)');
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
