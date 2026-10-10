import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConsumerWalletScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo p-6 items-center justify-center">
      <View className="w-16 h-16 rounded-2xl bg-consumidor/10 items-center justify-center mb-4">
        <Ionicons name="wallet-outline" size={32} color="#008D4C" />
      </View>
      <Text className="text-xl font-bold text-neutros-texto text-center mb-1">
        Carteira Digital
      </Text>
      <Text className="text-sm text-neutros-cinza text-center max-w-xs">
        Extrato detalhado e saldos segmentados por estabelecimento comercial (TASK-04).
      </Text>
    </SafeAreaView>
  );
}
