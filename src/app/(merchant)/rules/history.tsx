import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLoyaltyRuleHistory } from '@/hooks/useLoyaltyRules';
import { PointRule } from '@/services/loyaltyRules';

export default function LoyaltyRuleHistoryScreen() {
  const router = useRouter();
  const { data: history, isLoading, isError, refetch } = useLoyaltyRuleHistory();

  const renderItem = ({ item }: { item: PointRule }) => {
    const isActive = item.status === 'ACTIVE';

    return (
      <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View
              className={`w-2.5 h-2.5 rounded-full ${
                isActive ? 'bg-green-500' : 'bg-neutros-cinza'
              }`}
            />
            <Text className="text-base font-extrabold text-neutros-texto">
              Versão {item.version}
            </Text>
          </View>

          <View
            className={`px-2.5 py-1 rounded-full ${
              isActive ? 'bg-green-100' : 'bg-neutros-fundo'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isActive ? 'text-green-700' : 'text-neutros-cinza'
              }`}
            >
              {isActive ? 'Ativa' : 'Inativa'}
            </Text>
          </View>
        </View>

        <Text className="text-sm font-semibold text-neutros-texto mb-1">
          {item.name || `Regra v${item.version}`}
        </Text>

        <Text className="text-xs text-neutros-cinza leading-relaxed mb-3">
          {item.humanReadableSummary ||
            `A cada R$ ${item.baseAmount?.toFixed(2)} ganha ${item.pointsPerBase} ponto(s).`}
        </Text>

        <View className="flex-row gap-4 pt-3 border-t border-neutros-fundo">
          <View>
            <Text className="text-[10px] text-neutros-cinza uppercase">Base</Text>
            <Text className="text-xs font-bold text-neutros-texto">
              R$ {item.baseAmount?.toFixed(2)}
            </Text>
          </View>

          <View>
            <Text className="text-[10px] text-neutros-cinza uppercase">Pontos</Text>
            <Text className="text-xs font-bold text-lojista">
              {item.pointsPerBase} pts
            </Text>
          </View>

          <View>
            <Text className="text-[10px] text-neutros-cinza uppercase">Mínimo</Text>
            <Text className="text-xs font-bold text-neutros-texto">
              {item.minPurchaseAmount
                ? `R$ ${item.minPurchaseAmount.toFixed(2)}`
                : 'R$ 0,00'}
            </Text>
          </View>

          <View>
            <Text className="text-[10px] text-neutros-cinza uppercase">Teto</Text>
            <Text className="text-xs font-bold text-neutros-texto">
              {item.maxPointsPerPurchase ? `${item.maxPointsPerPurchase} pts` : 'Ilimitado'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      {/* Top Header com botão Voltar */}
      <View className="px-6 py-4 flex-row items-center gap-3 border-b border-neutros-borda/50 bg-white">
        <TouchableOpacity
          onPress={() => router.navigate('/(merchant)/(tabs)/rules')}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-extrabold text-neutros-texto">
            Histórico de Regras
          </Text>
          <Text className="text-xs text-neutros-cinza">
            Auditoria e versionamento imutável (RN04)
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6F35B5" />
          <Text className="text-xs text-neutros-cinza mt-2">Carregando histórico...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
          <Text className="text-sm font-semibold text-red-600 mt-2 text-center">
            Não foi possível carregar o histórico de regras.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 px-4 py-2 bg-lojista rounded-xl"
          >
            <Text className="text-white text-xs font-bold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history || []}
          keyExtractor={(item) => String(item.id || item.version)}
          renderItem={renderItem}
          contentContainerClassName="p-6"
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-sm text-neutros-cinza">
                Nenhuma versão anterior encontrada.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
