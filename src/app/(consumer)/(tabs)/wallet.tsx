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
import { formatCnpj } from '@/services/establishments';
import {
  calculateTotalAccumulated,
  calculateTotalBalance,
  CustomerPointBalance,
  isEstablishmentInactive,
} from '@/services/wallet.service';

export default function ConsumerWalletScreen() {
  const router = useRouter();
  const {
    data: balances,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCustomerBalances();

  const list = balances || [];
  const totalCurrent = calculateTotalBalance(list);
  const totalLifetime = calculateTotalAccumulated(list);

  const handleOpenStatement = (item: CustomerPointBalance) => {
    const establishmentId = item.establishment?.id ?? item.establishmentId ?? item.id;
    router.push({
      pathname: '/(consumer)/statement/[id]',
      params: {
        id: String(establishmentId),
        tradeName: item.establishment?.tradeName || 'Estabelecimento Parceiro',
        cnpj: item.establishment?.cnpj || '',
        currentBalance: String(item.currentBalance),
        totalAccumulated: String(item.totalAccumulated),
        status: item.establishment?.status || 'ACTIVE',
      },
    });
  };

  const renderBalanceCard = ({ item }: { item: CustomerPointBalance }) => {
    const tradeName = item.establishment?.tradeName || 'Estabelecimento Parceiro';
    const cnpj = item.establishment?.cnpj ? formatCnpj(item.establishment.cnpj) : '';
    const inactive = isEstablishmentInactive(item.establishment?.status);

    return (
      <TouchableOpacity
        onPress={() => handleOpenStatement(item)}
        activeOpacity={0.75}
        className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-3.5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3.5 flex-1 pr-3">
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center ${
                inactive ? 'bg-amber-500/10' : 'bg-consumidor/10'
              }`}
            >
              <Ionicons
                name="storefront"
                size={24}
                color={inactive ? '#D97706' : '#008D4C'}
              />
            </View>

            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="text-base font-extrabold text-neutros-texto"
              >
                {tradeName}
              </Text>
              {Boolean(cnpj) && (
                <Text className="text-[11px] font-mono text-neutros-cinza mt-0.5">
                  CNPJ: {cnpj}
                </Text>
              )}
              <Text className="text-xs text-neutros-cinza mt-1">
                Acumulado histórico: {item.totalAccumulated} pts
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text className="text-[10px] font-bold text-neutros-cinza uppercase tracking-wider">
              Saldo Disponível
            </Text>
            <View className="flex-row items-baseline gap-1 mt-0.5">
              <Text className="text-2xl font-black text-consumidor">
                {item.currentBalance}
              </Text>
              <Text className="text-xs font-bold text-pontos">pts</Text>
            </View>
          </View>
        </View>

        {/* RN05: Aviso sutil caso a loja esteja inativa ou inadimplente */}
        {inactive && (
          <View className="mt-3 pt-3 border-t border-amber-200/80 flex-row items-center gap-2">
            <Ionicons name="information-circle-outline" size={16} color="#D97706" />
            <Text className="text-[11px] font-semibold text-amber-700 flex-1">
              Loja temporariamente inativa para novos pontos (RN05: seu saldo está protegido)
            </Text>
          </View>
        )}

        <View className="mt-3 pt-2.5 border-t border-neutros-fundo flex-row items-center justify-between">
          <Text className="text-xs font-bold text-consumidor">
            Ver extrato detalhado
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#008D4C" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo" edges={['top']}>
      {/* Cabeçalho */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xs font-bold text-consumidor uppercase tracking-wider">
          Saldos por Loja (ADR-002)
        </Text>
        <Text className="text-2xl font-black text-neutros-texto tracking-tight mt-0.5">
          Carteira Digital
        </Text>
        <Text className="text-xs text-neutros-cinza mt-1">
          Seus pontos pertencem exclusivamente a cada estabelecimento onde foram conquistados.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-2">
          {/* Skeleton Loader Suave */}
          <View className="bg-consumidor/20 h-32 rounded-3xl mb-5 p-5 justify-between">
            <View className="w-32 h-4 bg-white/50 rounded-md" />
            <View className="w-24 h-8 bg-white/60 rounded-lg" />
          </View>
          <View className="bg-white p-5 rounded-3xl border border-neutros-borda mb-3 h-28 justify-between">
            <View className="w-48 h-4 bg-zinc-200 rounded-md" />
            <View className="w-32 h-3 bg-zinc-100 rounded-md" />
          </View>
          <View className="items-center justify-center py-6">
            <ActivityIndicator size="small" color="#008D4C" />
            <Text className="text-xs text-neutros-cinza font-semibold mt-2">
              Carregando sua carteira...
            </Text>
          </View>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
          </View>
          <Text className="text-base font-bold text-neutros-texto text-center">
            Erro ao carregar sua carteira
          </Text>
          <Text className="text-xs text-neutros-cinza text-center mt-1 mb-5">
            {error?.message || 'Não foi possível sincronizar seus saldos no momento.'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.8}
            className="px-6 py-3 bg-consumidor rounded-xl"
          >
            <Text className="text-white font-bold text-sm">Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBalanceCard}
          contentContainerClassName="px-5 pb-10 pt-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#008D4C']}
              tintColor="#008D4C"
            />
          }
          ListHeaderComponent={
            list.length > 0 ? (
              <View className="bg-consumidor p-5 rounded-3xl shadow-lg shadow-consumidor/20 mb-5">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-white/80 text-xs font-bold uppercase tracking-wider">
                      Total Agregado ({list.length} {list.length === 1 ? 'loja' : 'lojas'})
                    </Text>
                    <View className="flex-row items-baseline gap-1.5 mt-1">
                      <Text className="text-white text-3xl font-black">
                        {totalCurrent}
                      </Text>
                      <Text className="text-pontos text-base font-bold">pts ativos</Text>
                    </View>
                  </View>

                  <View className="bg-white/15 px-3.5 py-2 rounded-2xl border border-white/20 items-end">
                    <Text className="text-white/80 text-[10px] font-bold uppercase">
                      Acumulado Vida
                    </Text>
                    <Text className="text-white text-sm font-extrabold">
                      {totalLifetime} pts
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2 pt-3 border-t border-white/20">
                  <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                  <Text className="text-white/90 text-[11px] font-medium flex-1">
                    Toque em um estabelecimento abaixo para ver o extrato exclusivo da loja.
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-16 items-center justify-center px-6 bg-white rounded-3xl border border-neutros-borda mt-2">
              <View className="w-16 h-16 rounded-2xl bg-consumidor/10 items-center justify-center mb-4">
                <Ionicons name="wallet-outline" size={32} color="#008D4C" />
              </View>
              <Text className="text-base font-bold text-neutros-texto text-center">
                Sua carteira ainda está vazia
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1 mb-6 leading-relaxed">
                Escaneie o QR Code de uma nota fiscal (NFC-e) emitida em qualquer loja parceira para começar a acumular pontos!
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(consumer)/(tabs)/scan')}
                activeOpacity={0.8}
                className="px-6 py-3.5 bg-consumidor rounded-2xl flex-row items-center gap-2 shadow-md shadow-consumidor/20"
              >
                <Ionicons name="qr-code" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm">
                  Escanear Primeira Nota
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
