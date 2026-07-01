import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import '../global.css';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationType } from '@/types/database';

function storeNotificationFromResponse(response: Notifications.NotificationResponse) {
  const { content, identifier } = response.notification.request;
  useNotificationStore.getState().add({
    id: identifier,
    type: (content.data?.type as NotificationType) ?? 'UNKNOWN',
    title: content.title ?? '',
    body: content.body ?? '',
    receivedAt: new Date().toISOString(),
    isRead: false,
    data: (content.data as Record<string, unknown>) ?? {},
  });
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading } = useAuth();
  const scheme = useColorScheme();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  useNotifications();

  useEffect(() => {
    useNotificationStore.getState()._hydrate();
  }, []);

  // Baja cualquier OTA pendiente en este mismo lanzamiento para que esté lista
  // cuanto antes, pero SIN reloadAsync(): reiniciar el JS a mitad de un flujo
  // en curso (ej. el intercambio de código de reset-password) lo interrumpe y
  // pierde el estado. La actualización descargada se aplica sola en el
  // próximo arranque natural de la app.
  useEffect(() => {
    if (__DEV__) return;
    Updates.checkForUpdateAsync()
      .then((result) => {
        if (result.isAvailable) {
          return Updates.fetchUpdateAsync();
        }
      })
      .catch((e) => console.warn('[Updates] check failed:', e));
  }, []);

  // Cold start: app estaba cerrada, el usuario tocó la notificación
  useEffect(() => {
    if (!navigationState?.key) return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        storeNotificationFromResponse(response);
        router.push('/(app)/(tabs)/notifications');
      }
    });
  }, [navigationState?.key]);

  // Background: app estaba viva pero suspendida
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      storeNotificationFromResponse(response);
      router.push('/(app)/(tabs)/notifications');
    });
    return () => sub.remove();
  }, []);

  // Cold start: app estaba cerrada, el usuario tocó un link de recuperación/verificación de email
  const handledInitialUrlRef = useRef(false);
  useEffect(() => {
    if (!navigationState?.key || handledInitialUrlRef.current) return;
    handledInitialUrlRef.current = true;
    Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const screen = parsed.path || parsed.hostname;
      const code = parsed.queryParams?.code as string | undefined;
      const errorDescription = parsed.queryParams?.error_description as string | undefined;
      if (!code && !errorDescription) return;

      const params: Record<string, string> = {};
      if (code) params.code = code;
      if (errorDescription) params.error_description = errorDescription;

      if (screen === 'reset-password') {
        router.replace({ pathname: '/(auth)/reset-password', params });
      } else if (screen === 'verify-email') {
        router.replace({ pathname: '/(auth)/verify-email', params });
      }
    });
  }, [navigationState?.key]);

  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync(), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
