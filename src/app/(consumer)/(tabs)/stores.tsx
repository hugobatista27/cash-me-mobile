import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConsumerStoresScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo p-6 items-center justify-center">
      <View className="w-16 h-16 rounded-2xl bg-lojista/10 items-center justify-center mb-4">
        <Ionicons name="storefront-outline" size={32} color="#6F35B5" />
      </View>
      <Text className="text-xl font-bold text-neutros-texto text-center mb-1">
        Lojas Credenciadas
      </Text>
      <Text className="text-sm text-neutros-cinza text-center max-w-xs">
        Catálogo de estabelecimentos parceiros e regras de conversão ativas (TASK-05).
      </Text>
    </SafeAreaView>
  );
}
