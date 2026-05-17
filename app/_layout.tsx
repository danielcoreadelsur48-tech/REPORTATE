import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import '../global.css';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/services/supabase/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading } = useAuth();
  const scheme = useColorScheme();
  useNotifications();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (code) {
        supabase.auth.exchangeCodeForSession(code);
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
