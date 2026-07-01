import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useDeepLinkStore } from '@/store/deepLinkStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { session, isLoading } = useAuthStore();
  const deepLinkScreen = useDeepLinkStore((s) => s.screen);

  // Hay un flujo de reset-password/verify-email en curso: la sesión (de
  // recuperación, no un login real) no debe usarse como pase de entrada a la
  // app mientras esa pantalla todavía la necesita. Dejar que su propia
  // navegación se resuelva sin competir acá.
  if (isLoading || deepLinkScreen) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return <Redirect href={session ? '/(app)/(tabs)/home' : '/(auth)/login'} />;
}
