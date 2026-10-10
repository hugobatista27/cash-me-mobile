import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/use-auth-store';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user, isRestoringSession } = useAuthStore();

  useEffect(() => {
    if (isRestoringSession) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else if (user?.userType === 'ESTABLISHMENT') {
        router.replace('/(merchant)/(tabs)');
      } else {
        router.replace('/(consumer)/(tabs)');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.userType, isRestoringSession, router]);

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo justify-between items-center py-12 px-6">
      <View className="h-6" />

      {/* Hero / Brand Section */}
      <View className="items-center justify-center">
        <View className="w-24 h-24 rounded-3xl bg-consumidor items-center justify-center shadow-lg shadow-consumidor/30 mb-6">
          <Text className="text-white text-4xl font-extrabold tracking-tight">CM</Text>
        </View>

        <Text className="text-3xl font-extrabold text-neutros-texto tracking-tight mb-2">
          Cash<Text className="text-consumidor">Me</Text>
        </Text>

        <Text className="text-base font-medium text-neutros-cinza text-center">
          Fidelidade & Cashback Inteligente
        </Text>

        <View className="flex-row items-center gap-2 mt-4">
          <View className="px-2.5 py-1 rounded-full bg-consumidor/10">
            <Text className="text-xs font-semibold text-consumidor">Consumidor</Text>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-lojista/10">
            <Text className="text-xs font-semibold text-lojista">Lojista</Text>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-pontos/20">
            <Text className="text-xs font-bold text-amber-700">Pontos</Text>
          </View>
        </View>
      </View>

      {/* Loading Indicator */}
      <View className="items-center w-full max-w-xs">
        <ActivityIndicator size="large" color="#008D4C" className="mb-4" />
        <Text className="text-sm font-medium text-neutros-cinza text-center">
          Iniciando CashMe...
        </Text>
        <Text className="text-xs text-neutros-cinza/60 mt-2">v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}
