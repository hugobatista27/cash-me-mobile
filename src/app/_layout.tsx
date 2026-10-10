import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/use-auth-store';

function RootNavigation() {
  const { isAuthenticated, user, isRestoringSession, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isRestoringSession) return;

    const rootSegment = segments[0] as string | undefined;
    const inAuthGroup = rootSegment === '(auth)';
    const inConsumerGroup = rootSegment === '(consumer)';
    const inMerchantGroup = rootSegment === '(merchant)';

    if (!isAuthenticated) {
      // Usuário não autenticado tentando acessar telas protegidas
      if (!inAuthGroup && rootSegment !== undefined && rootSegment !== '+not-found') {
        router.replace('/(auth)/login');
      }
    } else {
      // Usuário autenticado tentando acessar telas de auth ou com role incompatível
      if (inAuthGroup) {
        if (user?.userType === 'ESTABLISHMENT') {
          router.replace('/(merchant)/(tabs)');
        } else {
          router.replace('/(consumer)/(tabs)');
        }
      } else if (user?.userType === 'CUSTOMER' && inMerchantGroup) {
        router.replace('/(consumer)/(tabs)');
      } else if (user?.userType === 'ESTABLISHMENT' && inConsumerGroup) {
        router.replace('/(merchant)/(tabs)');
      }
    }
  }, [isAuthenticated, user?.userType, isRestoringSession, segments, router]);

  if (isRestoringSession) {
    return (
      <View className="flex-1 bg-neutros-fundo items-center justify-center">
        <ActivityIndicator size="large" color="#008D4C" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(consumer)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(merchant)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="+not-found"
        options={{ title: 'Página Não Encontrada', headerShown: true }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <RootNavigation />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
