import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerProfile, useAuthStore } from '@/stores/use-auth-store';

export default function ConsumerHomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const customerProfile = profile as CustomerProfile | null;

  const displayName = customerProfile?.fullName || user?.email?.split('@')[0] || 'Consumidor';

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <ScrollView contentContainerClassName="p-6">
        {/* Header de Boas-vindas */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-xs font-bold text-consumidor uppercase tracking-wider">
              Área do Consumidor
            </Text>
            <Text className="text-2xl font-extrabold text-neutros-texto">
              Olá, {displayName} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/(tabs)/profile')}
            className="w-11 h-11 rounded-full bg-consumidor/10 items-center justify-center border border-consumidor/20"
          >
            <Ionicons name="person" size={20} color="#008D4C" />
          </TouchableOpacity>
        </View>

        {/* Card de Saldo de Pontos */}
        <View className="bg-consumidor p-6 rounded-3xl shadow-lg shadow-consumidor/20 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/80 text-sm font-medium">Pontos Acumulados</Text>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">CashMe Club</Text>
            </View>
          </View>
          <Text className="text-white text-4xl font-extrabold tracking-tight mb-4">
            0 <Text className="text-2xl font-normal text-white/80">pts</Text>
          </Text>
          <View className="flex-row items-center gap-2 pt-2 border-t border-white/20">
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text className="text-white/90 text-xs font-medium">
              Saldos isolados e protegidos por estabelecimento
            </Text>
          </View>
        </View>

        {/* Atalhos Rápidos */}
        <Text className="text-lg font-bold text-neutros-texto mb-3">Ações Rápidas</Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/(tabs)/scan')}
            activeOpacity={0.8}
            className="flex-1 bg-white p-4 rounded-2xl border border-neutros-borda items-center shadow-sm"
          >
            <View className="w-12 h-12 rounded-xl bg-consumidor/10 items-center justify-center mb-2">
              <Ionicons name="qr-code" size={24} color="#008D4C" />
            </View>
            <Text className="text-sm font-bold text-neutros-texto">Escanear Nota</Text>
            <Text className="text-xs text-neutros-cinza text-center mt-1">Ler QR Code NFC-e</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(consumer)/(tabs)/stores')}
            activeOpacity={0.8}
            className="flex-1 bg-white p-4 rounded-2xl border border-neutros-borda items-center shadow-sm"
          >
            <View className="w-12 h-12 rounded-xl bg-lojista/10 items-center justify-center mb-2">
              <Ionicons name="storefront" size={24} color="#6F35B5" />
            </View>
            <Text className="text-sm font-bold text-neutros-texto">Lojas Parceiras</Text>
            <Text className="text-xs text-neutros-cinza text-center mt-1">Ver regulamentos</Text>
          </TouchableOpacity>
        </View>

        {/* Informações da Conta */}
        <View className="bg-white p-5 rounded-2xl border border-neutros-borda">
          <Text className="text-base font-bold text-neutros-texto mb-2">
            Status da Sua Conta
          </Text>
          <View className="flex-row items-center justify-between py-2 border-b border-neutros-fundo">
            <Text className="text-sm text-neutros-cinza">E-mail</Text>
            <Text className="text-sm font-medium text-neutros-texto">{user?.email}</Text>
          </View>
          <View className="flex-row items-center justify-between py-2 border-b border-neutros-fundo">
            <Text className="text-sm text-neutros-cinza">Tipo de Conta</Text>
            <Text className="text-sm font-bold text-consumidor">Consumidor Ativo</Text>
          </View>
          {customerProfile?.cpf && (
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-sm text-neutros-cinza">CPF Vinculado</Text>
              <Text className="text-sm font-medium text-neutros-texto">{customerProfile.cpf}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
