import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstablishmentProfile, useAuthStore } from '@/stores/use-auth-store';
import { useActiveLoyaltyRule } from '@/hooks/useLoyaltyRules';

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { user, profile, establishment } = useAuthStore();
  const establishmentProfile = profile as EstablishmentProfile | null;
  const { data: activeRule, isLoading: isLoadingRule } = useActiveLoyaltyRule();

  const tradeName = establishment?.tradeName || 'Meu Comércio';
  const status = establishment?.status;
  const isPending = status === 'PENDING';
  const isInactive = status === 'INACTIVE';

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <ScrollView contentContainerClassName="p-6">
        {/* Header do Lojista */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-xs font-bold text-lojista uppercase tracking-wider">
              Painel do Estabelecimento
            </Text>
            <Text className="text-2xl font-extrabold text-neutros-texto">
              {tradeName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(merchant)/(tabs)/profile')}
            className="w-11 h-11 rounded-full bg-lojista/10 items-center justify-center border border-lojista/20"
          >
            <Ionicons name="business" size={20} color="#6F35B5" />
          </TouchableOpacity>
        </View>

        {/* Card de Boas-vindas e Status */}
        <View className="bg-lojista p-6 rounded-3xl shadow-lg shadow-lojista/20 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/80 text-sm font-medium">Status do Comércio</Text>
            <View
              className={`px-3 py-1 rounded-full ${
                isPending ? 'bg-amber-400' : isInactive ? 'bg-red-500' : 'bg-green-500'
              }`}
            >
              <Text className="text-white text-xs font-bold">
                {isPending ? 'Pendente de Homologação' : isInactive ? 'Inativo / Suspenso' : 'Homologado'}
              </Text>
            </View>
          </View>

          <Text className="text-white text-3xl font-extrabold tracking-tight mb-2">
            Gestão Ativa
          </Text>

          <Text className="text-white/90 text-sm mb-3">
            CNPJ: {establishment?.cnpj || 'Não informado'}
          </Text>

          {/* Regra Ativa de Pontos */}
          <View className="bg-white/10 rounded-2xl p-3.5 mb-3 border border-white/15">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="sparkles" size={14} color="#F5B800" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Regra de Pontos Vigente
                </Text>
              </View>
              {activeRule && (
                <View className="bg-pontos px-2 py-0.5 rounded-full">
                  <Text className="text-neutros-texto text-[10px] font-black">
                    v{activeRule.version}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-white font-medium text-xs">
              {isLoadingRule
                ? 'Carregando regra...'
                : activeRule?.humanReadableSummary || 'Nenhuma regra ativa configurada.'}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 pt-2 border-t border-white/20">
            <Ionicons name="person-circle" size={16} color="#FFFFFF" />
            <Text className="text-white/90 text-xs font-medium">
              Gestor: {establishmentProfile?.fullName || user?.email}
            </Text>
          </View>
        </View>

        {/* Ações Rápidas do Lojista */}
        <Text className="text-lg font-bold text-neutros-texto mb-3">Gerenciamento</Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(merchant)/(tabs)/rules')}
            activeOpacity={0.8}
            className="flex-1 bg-white p-4 rounded-2xl border border-neutros-borda items-center shadow-sm"
          >
            <View className="w-12 h-12 rounded-xl bg-lojista/10 items-center justify-center mb-2">
              <Ionicons name="calculator" size={24} color="#6F35B5" />
            </View>
            <Text className="text-sm font-bold text-neutros-texto">Regras de Pontos</Text>
            <Text className="text-xs text-neutros-cinza text-center mt-1">Configurar conversão</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(merchant)/(tabs)/customers')}
            activeOpacity={0.8}
            className="flex-1 bg-white p-4 rounded-2xl border border-neutros-borda items-center shadow-sm"
          >
            <View className="w-12 h-12 rounded-xl bg-consumidor/10 items-center justify-center mb-2">
              <Ionicons name="people" size={24} color="#008D4C" />
            </View>
            <Text className="text-sm font-bold text-neutros-texto">Clientes</Text>
            <Text className="text-xs text-neutros-cinza text-center mt-1">Base de fidelidade</Text>
          </TouchableOpacity>
        </View>

        {/* Informações Regulatórias */}
        <View className="bg-white p-5 rounded-2xl border border-neutros-borda">
          <Text className="text-base font-bold text-neutros-texto mb-2">
            Regras de Negócio (RN06)
          </Text>
          <Text className="text-xs text-neutros-cinza leading-relaxed">
            Estabelecimentos em status PENDING têm acesso completo ao aplicativo para simular e estruturar regras de pontos, porém a pontuação em notas fiscais de clientes aguarda a homologação da equipe administrativa.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
