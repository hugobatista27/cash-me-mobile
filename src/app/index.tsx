import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { checkHealth } from '@/services/api';
import { useAppStore } from '@/stores/use-app-store';

export default function SplashScreen() {
  const { setIsLoading, setIsReady, setIsConnected } = useAppStore();
  const [statusText, setStatusText] = useState('Inicializando...');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const initialize = async () => {
      try {
        setStatusText('Verificando conexão com a API...');
        const healthy = await checkHealth();
        if (isMounted) {
          setIsConnected(healthy);
          setStatusText(healthy ? 'Conexão estabelecida!' : 'Modo offline ou API indisponível');
        }
      } catch {
        if (isMounted) {
          setIsConnected(false);
          setStatusText('Modo offline');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    const timer = setTimeout(() => {
      initialize();
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [setIsConnected, setIsLoading, setIsReady]);

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo justify-between items-center py-12 px-6">
      {/* Top spacing */}
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

      {/* Loading & Status Section */}
      <View className="items-center w-full max-w-xs">
        <ActivityIndicator size="large" color="#008D4C" className="mb-4" />
        <Text className="text-sm font-medium text-neutros-cinza text-center">
          {statusText}
        </Text>
        <Text className="text-xs text-neutros-cinza/60 mt-2">
          v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
