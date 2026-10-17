import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RewardCard, RewardCardItem } from '@/components/merchant/reward-card';
import {
  useEstablishmentRewards,
  useToggleRewardStatusMutation,
} from '@/hooks/useRewards';

export const REWARDS_QUERY_KEY = ['establishment', 'rewards'] as const;

export default function MerchantRewardsScreen() {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | number | null>(null);

  const {
    data: rewards = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useEstablishmentRewards();

  const toggleStatusMutation = useToggleRewardStatusMutation();

  const handleToggleStatus = (
    reward: RewardCardItem,
    nextStatus: 'ACTIVE' | 'INACTIVE'
  ) => {
    setTogglingId(reward.id);
    toggleStatusMutation.mutate(
      { id: reward.id, status: nextStatus },
      {
        onError: () => {
          Alert.alert(
            'Erro ao atualizar',
            'Não foi possível alterar o status da recompensa. Tente novamente.'
          );
        },
        onSettled: () => {
          setTogglingId(null);
        },
      }
    );
  };

  const activeCount = rewards.filter((r) => r.status === 'ACTIVE').length;

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      {/* Cabeçalho */}
      <View className="px-6 py-4 bg-white border-b border-neutros-borda flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 mr-3">
          <TouchableOpacity
            onPress={() => router.navigate('/(merchant)/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Voltar para o painel"
            className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
          >
            <Ionicons name="arrow-back" size={20} color="#171717" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-neutros-texto">
              Recompensas & Cupons
            </Text>
            <Text className="text-xs text-neutros-cinza">
              {rewards.length > 0
                ? `${activeCount} ativa(s) de ${rewards.length} cadastrada(s)`
                : 'Catálogo de benefícios da loja'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(merchant)/rewards/create')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Nova Recompensa"
          testID="new-reward-button"
          style={{ backgroundColor: '#6F35B5' }}
          className="bg-lojista px-4 py-2.5 rounded-2xl flex-row items-center gap-1.5 shadow-sm"
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text className="text-white text-xs font-extrabold">
            Nova Recompensa
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo Principal */}
      {isLoading ? (
        <View
          testID="rewards-loading"
          className="flex-1 items-center justify-center p-6"
        >
          <ActivityIndicator size="large" color="#6F35B5" />
          <Text className="text-sm font-medium text-neutros-cinza mt-3">
            Carregando catálogo de recompensas...
          </Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-3">
            <Ionicons name="alert-circle-outline" size={32} color="#D64545" />
          </View>
          <Text className="text-base font-bold text-neutros-texto text-center">
            Falha ao carregar recompensas
          </Text>
          <Text className="text-xs text-neutros-cinza text-center mt-1 mb-4 max-w-xs">
            Verifique sua conexão e tente atualizar a lista novamente.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            className="bg-lojista px-5 py-3 rounded-2xl"
          >
            <Text className="text-white text-xs font-bold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rewards}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="p-6 pb-12 grow"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#6F35B5"
              colors={['#6F35B5']}
            />
          }
          renderItem={({ item }) => (
            <RewardCard
              reward={item}
              onToggleStatus={handleToggleStatus}
              isToggling={togglingId === item.id}
            />
          )}
          ListEmptyComponent={
            <View
              testID="rewards-empty-state"
              className="flex-1 items-center justify-center py-16 px-6"
            >
              <View className="w-20 h-20 rounded-3xl bg-lojista/10 border border-lojista/20 items-center justify-center mb-4">
                <Ionicons name="gift-outline" size={40} color="#6F35B5" />
              </View>
              <Text className="text-lg font-extrabold text-neutros-texto text-center mb-1">
                Nenhuma recompensa cadastrada
              </Text>
              <Text className="text-sm text-neutros-cinza text-center leading-relaxed max-w-xs mb-6">
                Crie cupons de desconto em reais (R$) ou percentual (%) para seus
                clientes trocarem por pontos acumulados.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(merchant)/rewards/create')}
                activeOpacity={0.85}
                style={{ backgroundColor: '#6F35B5' }}
                className="bg-lojista px-6 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-sm"
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-bold">
                  Criar Primeira Recompensa
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
