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
import { useDeepLinkStore } from '@/store/deepLinkStore';
import { NotificationType } from '@/types/database';

function redactUrl(url: string) {
  return url.replace(/code=[^&]+/, 'code=REDACTED');
}

function handleAuthDeepLink(rawUrl: string, router: ReturnType<typeof useRouter>, source: string) {
  const pushRaw = useDeepLinkStore.getState().pushRaw;
  pushRaw(`[${source}] handleAuthDeepLink called with: ${redactUrl(rawUrl)}`);

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    pushRaw(`[${source}] new URL() threw: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }
  const screen = (parsed.hostname || parsed.pathname.replace(/^\//, '')) as 'reset-password' | 'verify-email' | string;
  const code = parsed.searchParams.get('code');
  const errorDescription = parsed.searchParams.get('error_description');
  pushRaw(
    `[${source}] parsed -> screen=${screen} code=${code ? code.slice(0, 8) + '…' : 'null'} error=${errorDescription ?? 'null'}`
  );
  if (!code && !errorDescription) {
    pushRaw(`[${source}] no code/error, abortando`);
    return;
  }
  if (screen !== 'reset-password' && screen !== 'verify-email') {
    pushRaw(`[${source}] screen "${screen}" no matchea, abortando`);
    return;
  }

  useDeepLinkStore.getState().setLink({ screen, code, errorDescription });
  router.replace(`/(auth)/${screen}` as '/(auth)/reset-password' | '/(auth)/verify-email');
}

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
    useDeepLinkStore.getState().pushRaw('[cold-start] checking Linking.getInitialURL()…');
    Linking.getInitialURL().then((url) => {
      useDeepLinkStore.getState().pushRaw(`[cold-start] getInitialURL resolved: ${url ? redactUrl(url) : 'null'}`);
      if (url) handleAuthDeepLink(url, router, 'cold-start');
    });
  }, [navigationState?.key]);

  // Warm start: app ya estaba viva (foreground o background) y el usuario tocó el link
  useEffect(() => {
    useDeepLinkStore.getState().pushRaw('[warm-start] Linking listener attached');
    const sub = Linking.addEventListener('url', (event) => {
      useDeepLinkStore
        .getState()
        .pushRaw(`[warm-start] url event fired: hasUrl=${!!event?.url} value=${event?.url ? redactUrl(event.url) : 'undefined'}`);
      if (event?.url) handleAuthDeepLink(event.url, router, 'warm-start');
    });
    return () => sub.remove();
  }, []);

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
