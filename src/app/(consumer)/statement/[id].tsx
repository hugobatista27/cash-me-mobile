import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCustomerBalances, useEstablishmentStatement } from '@/hooks/useWallet';
import { formatCnpj } from '@/services/establishments';
import {
  formatTransactionDate,
  isEstablishmentInactive,
  PointTransaction,
} from '@/services/wallet.service';
import { formatCurrency } from '@/utils/nfceParser';

export default function ConsumerStatementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    tradeName?: string;
    cnpj?: string;
    currentBalance?: string;
    totalAccumulated?: string;
    status?: string;
  }>();

  const establishmentId = params.id;

  const {
    data: transactions,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEstablishmentStatement(establishmentId);

  const { data: balances, refetch: refetchBalances } = useCustomerBalances();

  // Sincroniza dados do estabelecimento a partir da lista de saldos ou dos parâmetros de rota
  const matchedBalance = useMemo(() => {
    if (!balances || !establishmentId) return undefined;
    return balances.find(
      (b) =>
        String(b.establishment?.id ?? b.establishmentId ?? b.id) === String(establishmentId)
    );
  }, [balances, establishmentId]);

  const tradeName =
    matchedBalance?.establishment?.tradeName || params.tradeName || 'Estabelecimento Parceiro';
  const rawCnpj = matchedBalance?.establishment?.cnpj || params.cnpj || '';
  const formattedCnpj = rawCnpj ? formatCnpj(rawCnpj) : '';
  const currentBalance =
    matchedBalance?.currentBalance ??
    (params.currentBalance !== undefined ? Number(params.currentBalance) : 0);
  const totalAccumulated =
    matchedBalance?.totalAccumulated ??
    (params.totalAccumulated !== undefined ? Number(params.totalAccumulated) : currentBalance);
  const status = matchedBalance?.establishment?.status || params.status || 'ACTIVE';
  const inactive = isEstablishmentInactive(status);

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchBalances()]);
  };

  const renderTransactionItem = ({ item }: { item: PointTransaction }) => {
    const isCredit = item.type === 'CREDIT';
    const isReversal = item.type === 'REVERSAL';
    const absPoints = Math.abs(item.points);
    const formattedSignPoints = isCredit ? `+${absPoints} pts` : `-${absPoints} pts`;

    const content = (
      <View className="bg-white p-4 rounded-2xl border border-neutros-borda shadow-sm mb-3 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className={`w-11 h-11 rounded-2xl items-center justify-center ${
              isCredit
                ? 'bg-consumidor/10'
                : isReversal
                ? 'bg-amber-500/10'
                : 'bg-red-500/10'
            }`}
          >
            <Ionicons
              name={
                isCredit
                  ? 'arrow-up-circle-outline'
                  : isReversal
                  ? 'refresh-circle-outline'
                  : 'arrow-down-circle-outline'
              }
              size={24}
              color={isCredit ? '#008D4C' : isReversal ? '#D97706' : '#DC2626'}
            />
          </View>

          <View className="flex-1">
            <Text className="text-sm font-bold text-neutros-texto">
              {item.description || (isCredit ? 'Crédito de Pontos' : 'Movimentação de Pontos')}
            </Text>
            <Text className="text-[11px] text-neutros-cinza mt-0.5">
              {formatTransactionDate(item.createdAt)}
            </Text>
            {item.purchaseAmount !== undefined && item.purchaseAmount !== null && (
              <Text className="text-[11px] font-medium text-neutros-cinza mt-0.5">
                Compra: {formatCurrency(Number(item.purchaseAmount))}
              </Text>
            )}
          </View>
        </View>

        <View className="items-end">
          <Text
            className={`text-base font-extrabold ${
              isCredit ? 'text-consumidor' : 'text-red-600'
            }`}
          >
            {formattedSignPoints}
          </Text>
          <Text className="text-[10px] font-bold uppercase text-neutros-cinza mt-0.5">
            {isCredit ? 'Crédito' : isReversal ? 'Estorno' : 'Débito'}
          </Text>
          {Boolean(item.invoiceId) && (
            <View className="flex-row items-center gap-0.5 mt-1">
              <Text className="text-[10px] font-bold text-consumidor">Ver nota</Text>
              <Ionicons name="chevron-forward" size={11} color="#008D4C" />
            </View>
          )}
        </View>
      </View>
    );

    if (item.invoiceId) {
      return (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/(consumer)/invoice/[id]',
              params: {
                id: String(item.invoiceId),
                tradeName,
              },
            })
          }
          activeOpacity={0.75}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo" edges={['top']}>
      {/* Barra Superior */}
      <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-neutros-borda/60">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(consumer)/(tabs)/wallet');
            }
          }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>

        <View className="flex-1 items-center px-3">
          <Text className="text-[10px] font-bold text-consumidor uppercase tracking-wider">
            Extrato da Loja
          </Text>
          <Text
            numberOfLines={1}
            className="text-sm font-extrabold text-neutros-texto"
          >
            {tradeName}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/(consumer)/store/${establishmentId}`)}
          accessibilityLabel="Detalhes da Loja"
          className="w-10 h-10 rounded-full bg-consumidor/10 items-center justify-center border border-consumidor/20"
        >
          <Ionicons name="storefront-outline" size={18} color="#008D4C" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 p-5">
          {/* Skeleton Loader */}
          <View className="bg-consumidor/20 h-36 rounded-3xl mb-5 p-5 justify-between">
            <View className="w-40 h-4 bg-white/50 rounded-md" />
            <View className="w-28 h-8 bg-white/60 rounded-lg" />
          </View>
          <View className="bg-white p-4 rounded-2xl border border-neutros-borda mb-3 h-20 justify-center">
            <View className="w-48 h-4 bg-zinc-200 rounded-md mb-2" />
            <View className="w-28 h-3 bg-zinc-100 rounded-md" />
          </View>
          <View className="items-center justify-center py-6">
            <ActivityIndicator size="small" color="#008D4C" />
            <Text className="text-xs text-neutros-cinza font-semibold mt-2">
              Carregando movimentações...
            </Text>
          </View>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
          </View>
          <Text className="text-base font-bold text-neutros-texto text-center">
            Não foi possível carregar o extrato
          </Text>
          <Text className="text-xs text-neutros-cinza text-center mt-1 mb-5">
            {error?.message || 'Verifique sua conexão e tente novamente.'}
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
          data={transactions || []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTransactionItem}
          contentContainerClassName="p-5 pb-12"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={['#008D4C']}
              tintColor="#008D4C"
            />
          }
          ListHeaderComponent={
            <View className="mb-5">
              {/* Card de Saldo Isolado da Loja */}
              <View className="bg-consumidor p-6 rounded-3xl shadow-lg shadow-consumidor/25">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 pr-2">
                    <Text className="text-white font-extrabold text-lg">
                      {tradeName}
                    </Text>
                    {Boolean(formattedCnpj) && (
                      <Text className="text-white/80 text-xs font-mono mt-0.5">
                        CNPJ: {formattedCnpj}
                      </Text>
                    )}
                  </View>
                  <View className="bg-white/20 px-3 py-1 rounded-full">
                    <Text className="text-white text-[10px] font-bold uppercase">
                      Saldo Exclusivo
                    </Text>
                  </View>
                </View>

                <Text className="text-white/80 text-xs font-bold uppercase tracking-wider">
                  Saldo Atual Disponível
                </Text>
                <View className="flex-row items-baseline gap-1.5 mt-0.5 mb-3">
                  <Text className="text-white text-4xl font-black">
                    {currentBalance}
                  </Text>
                  <Text className="text-pontos text-xl font-bold">pts</Text>
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-white/20">
                  <Text className="text-white/90 text-xs font-medium">
                    Total acumulado nesta loja: {totalAccumulated} pts
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(consumer)/(tabs)/scan')}
                    className="bg-white/20 px-3 py-1.5 rounded-xl flex-row items-center gap-1"
                  >
                    <Ionicons name="qr-code" size={13} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Pontuar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* RN05: Banner se a loja estiver inativa */}
              {inactive && (
                <View className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mt-3 flex-row items-center gap-3">
                  <Ionicons name="shield-checkmark-outline" size={22} color="#D97706" />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-amber-900">
                      Loja temporariamente inativa para novos pontos
                    </Text>
                    <Text className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                      Conforme a regra RN05, seu saldo adquirido de {currentBalance} pts e todo o seu histórico permanecem integralmente preservados.
                    </Text>
                  </View>
                </View>
              )}

              <Text className="text-sm font-bold text-neutros-texto uppercase tracking-wider mt-6 mb-1">
                Histórico de Movimentações ({(transactions || []).length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="py-12 items-center justify-center px-6 bg-white rounded-3xl border border-neutros-borda">
              <View className="w-14 h-14 rounded-2xl bg-zinc-100 items-center justify-center mb-3">
                <Ionicons name="receipt-outline" size={28} color="#9CA3AF" />
              </View>
              <Text className="text-sm font-bold text-neutros-texto text-center">
                Nenhuma movimentação registrada
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1 max-w-xs">
                Seus lançamentos de crédito e resgate de pontos neste estabelecimento aparecerão aqui.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
