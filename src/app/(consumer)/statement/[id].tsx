import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEstablishmentStatement } from '@/hooks/useWallet';
import { PointTransactionItem } from '@/services/wallet';

export default function ConsumerStatementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    tradeName?: string;
    cnpj?: string;
    status?: string;
    currentBalance?: string;
  }>();

  const establishmentId = params.id;
  const isInactive = params.status === 'INACTIVE';

  const {
    data: transactions = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useEstablishmentStatement(establishmentId);

  const renderTransaction = ({ item }: { item: PointTransactionItem }) => {
    const isDebit = item.type === 'DEBIT';
    const isReversal = item.type === 'REVERSAL';
    const sign = isDebit ? '-' : '+';
    const colorClass = isDebit
      ? 'text-red-600'
      : isReversal
        ? 'text-amber-600'
        : 'text-consumidor';
    const badgeLabel = isDebit ? 'Resgate' : isReversal ? 'Estorno' : 'Crédito';

    return (
      <View className="bg-white p-4 rounded-2xl border border-neutros-borda mb-2.5 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-neutros-cinza">
              {badgeLabel}
            </Text>
            <Text className="text-[10px] text-neutros-cinza">
              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <Text className="text-sm font-semibold text-neutros-texto">{item.description}</Text>
        </View>
        <Text className={`text-base font-black ${colorClass}`}>
          {sign}
          {Math.abs(Number(item.points))} pts
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-neutros-borda/60">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(consumer)/(tabs)/wallet'))}
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>
        <View className="flex-1 mx-3">
          <Text className="text-base font-extrabold text-neutros-texto" numberOfLines={1}>
            {params.tradeName || 'Extrato da Loja'}
          </Text>
          {params.cnpj ? (
            <Text className="text-xs text-neutros-cinza">CNPJ: {params.cnpj}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/(consumer)/store/${establishmentId}` as never)}
          className="px-3 py-2 bg-lojista/10 rounded-xl"
        >
          <Text className="text-xs font-bold text-lojista">Recompensas</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 pt-4 pb-2">
        <View className="bg-consumidor p-5 rounded-3xl mb-3">
          <Text className="text-white/80 text-xs font-semibold">Saldo Disponível nesta Loja</Text>
          <Text className="text-white text-3xl font-black mt-0.5">
            {params.currentBalance ?? '0'} pts
          </Text>
        </View>

        {isInactive && (
          <View className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex-row items-center gap-2 mb-2">
            <Ionicons name="warning-outline" size={18} color="#D97706" />
            <Text className="text-xs text-amber-900 flex-1 font-medium">
              Estabelecimento temporariamente inativo (RN05/RN11). Pontuações e novos resgates estão suspensos, mas seu histórico permanece protegido.
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#008D4C" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-sm font-semibold text-red-600 text-center">
            Erro ao carregar o extrato desta loja.
          </Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-4 px-4 py-2 bg-consumidor rounded-xl">
            <Text className="text-white text-xs font-bold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTransaction}
          contentContainerClassName="px-6 pb-8"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#008D4C" />
          }
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-sm text-neutros-cinza">
                Nenhuma movimentação registrada nesta loja.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
