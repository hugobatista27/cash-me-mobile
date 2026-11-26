import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { useCustomerBalances } from '@/hooks/useWallet';
import { PointBalanceItem } from '@/services/wallet';

export default function ConsumerWalletScreen() {
  const router = useRouter();
  const { data: balances = [], isLoading, isError, isRefetching, refetch } = useCustomerBalances();

  const totalAvailable = balances.reduce((sum, item) => sum + Number(item.currentBalance || 0), 0);
  const totalAccumulated = balances.reduce(
    (sum, item) => sum + Number(item.totalAccumulated || 0),
    0
  );

  const renderBalanceCard = ({ item }: { item: PointBalanceItem }) => {
    const isInactive = item.establishment?.status === 'INACTIVE';

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/(consumer)/statement/[id]',
            params: {
              id: String(item.establishmentId),
              tradeName: item.establishment?.tradeName || 'Estabelecimento',
              cnpj: item.establishment?.cnpj || '',
              status: item.establishment?.status || 'ACTIVE',
              currentBalance: String(item.currentBalance),
            },
          })
        }
        activeOpacity={0.8}
        className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-3"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-base font-extrabold text-neutros-texto" numberOfLines={1}>
              {item.establishment?.tradeName || 'Estabelecimento Parceiro'}
            </Text>
            <Text className="text-xs text-neutros-cinza mt-0.5">
              CNPJ: {item.establishment?.cnpj || 'Não informado'}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xl font-black text-consumidor">{item.currentBalance} pts</Text>
            <Text className="text-[11px] text-neutros-cinza">
              Acumulado: {item.totalAccumulated} pts
            </Text>
          </View>
        </View>

        {isInactive && (
          <View className="mt-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex-row items-center gap-1.5">
            <Ionicons name="information-circle" size={14} color="#D97706" />
            <Text className="text-[11px] font-semibold text-amber-800 flex-1">
              Loja temporariamente inativa para novos pontos/resgates (RN05). Seu saldo histórico está preservado.
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between pt-3 mt-3 border-t border-neutros-fundo">
          <Text className="text-xs font-semibold text-consumidor">Ver extrato da loja</Text>
          <Ionicons name="chevron-forward" size={16} color="#008D4C" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-bold text-consumidor uppercase tracking-wider">
            Saldos Multi-Tenant
          </Text>
          <Text className="text-2xl font-extrabold text-neutros-texto">Carteira Digital</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(consumer)/coupons')}
          className="flex-row items-center gap-1.5 px-3 py-2 bg-pontos/15 rounded-2xl border border-pontos/30"
        >
          <Ionicons name="ticket-outline" size={16} color="#B45309" />
          <Text className="text-xs font-bold text-amber-900">Meus Cupons</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 mb-4">
        <View className="bg-consumidor p-5 rounded-3xl shadow-md shadow-consumidor/20 flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-xs font-semibold">Saldo Total Consolidado</Text>
            <Text className="text-white text-3xl font-black mt-0.5">{totalAvailable} pts</Text>
          </View>
          <View className="items-end">
            <Text className="text-white/80 text-[11px]">Acumulado Histórico</Text>
            <Text className="text-white text-sm font-bold">{totalAccumulated} pts</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#008D4C" />
          <Text className="text-xs text-neutros-cinza mt-2">Carregando seus saldos...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
          <Text className="text-sm font-semibold text-red-600 mt-2 text-center">
            Não foi possível carregar sua carteira de pontos.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 px-5 py-2.5 bg-consumidor rounded-xl"
          >
            <Text className="text-white text-xs font-bold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={balances}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBalanceCard}
          contentContainerClassName="px-6 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#008D4C"
            />
          }
          ListEmptyComponent={
            <View className="bg-white p-8 rounded-3xl border border-neutros-borda items-center mt-4">
              <View className="w-16 h-16 rounded-2xl bg-consumidor/10 items-center justify-center mb-4">
                <Ionicons name="wallet-outline" size={32} color="#008D4C" />
              </View>
              <Text className="text-base font-bold text-neutros-texto text-center mb-1">
                Nenhum saldo acumulado ainda
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mb-5 leading-relaxed">
                Escaneie o QR Code de uma NFC-e em estabelecimentos parceiros para começar a pontuar.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(consumer)/(tabs)/scan')}
                className="px-5 py-3 bg-consumidor rounded-2xl"
              >
                <Text className="text-white text-xs font-bold">Escanear Primeira NFC-e</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
