import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CouponCard } from '@/components/consumer/coupon-card';
import { useCustomerCoupons } from '@/hooks/useCoupons';
import {
  CouponRedemption,
  isCouponActive,
  isCouponExpired,
} from '@/services/coupons.service';

type FilterTab = 'ALL' | 'ACTIVE' | 'USED' | 'INACTIVE';

export default function ConsumerCouponsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<FilterTab>('ACTIVE');

  const {
    data: coupons = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCustomerCoupons();

  // Filtragem local conforme aba selecionada
  const filteredCoupons = useMemo(() => {
    if (selectedTab === 'ALL') return coupons;
    if (selectedTab === 'ACTIVE') {
      return coupons.filter((c) => isCouponActive(c));
    }
    if (selectedTab === 'USED') {
      return coupons.filter((c) => c.status === 'USED');
    }
    // 'INACTIVE': cancelados ou expirados
    return coupons.filter((c) => c.status === 'CANCELLED' || isCouponExpired(c));
  }, [coupons, selectedTab]);

  const activeCount = useMemo(
    () => coupons.filter((c) => isCouponActive(c)).length,
    [coupons]
  );
  const usedCount = useMemo(
    () => coupons.filter((c) => c.status === 'USED').length,
    [coupons]
  );
  const inactiveCount = useMemo(
    () => coupons.filter((c) => c.status === 'CANCELLED' || isCouponExpired(c)).length,
    [coupons]
  );

  const handleOpenCouponDetail = (coupon: CouponRedemption) => {
    router.push({
      pathname: '/(consumer)/coupons/[id]',
      params: { id: String(coupon.id) },
    });
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ACTIVE', label: 'Ativos', count: activeCount },
    { key: 'USED', label: 'Utilizados', count: usedCount },
    { key: 'INACTIVE', label: 'Expirados / Cancelados', count: inactiveCount },
    { key: 'ALL', label: 'Todos', count: coupons.length },
  ];

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo" edges={['top']}>
      {/* Barra de Topo / Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutros-borda/60 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>

        <View className="flex-1 items-center px-3">
          <Text className="text-base font-extrabold text-neutros-texto">
            Meus Cupons
          </Text>
          <Text className="text-[11px] text-neutros-cinza">
            {activeCount} {activeCount === 1 ? 'cupom ativo' : 'cupons ativos'} para uso
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(consumer)/(tabs)/stores')}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-consumidor/10 items-center justify-center border border-consumidor/20"
          accessibilityLabel="Explorar Lojas"
        >
          <Ionicons name="storefront-outline" size={18} color="#008D4C" />
        </TouchableOpacity>
      </View>

      {/* Tabs / Filtros por Status */}
      <View className="bg-white px-5 py-3 border-b border-neutros-borda/60">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item.key}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => {
            const isSelected = selectedTab === item.key;
            return (
              <TouchableOpacity
                onPress={() => setSelectedTab(item.key)}
                activeOpacity={0.75}
                testID={`tab-filter-${item.key}`}
                className={`px-3.5 py-2 rounded-2xl flex-row items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-consumidor border-consumidor'
                    : 'bg-neutros-fundo border-neutros-borda'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-neutros-texto'
                  }`}
                >
                  {item.label}
                </Text>
                <View
                  className={`px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20' : 'bg-zinc-200'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-black ${
                      isSelected ? 'text-white' : 'text-neutros-cinza'
                    }`}
                  >
                    {item.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Lista de Cupons */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#008D4C" />
          <Text className="text-xs text-neutros-cinza font-semibold mt-3">
            Carregando seus cupons...
          </Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
          </View>
          <Text className="text-base font-bold text-neutros-texto text-center">
            Erro ao carregar cupons
          </Text>
          <Text className="text-xs text-neutros-cinza text-center mt-1 mb-5">
            {error?.message || 'Não conseguimos obter a lista de cupons no momento.'}
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
          data={filteredCoupons}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="p-5 pb-12"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#008D4C']}
              tintColor="#008D4C"
            />
          }
          renderItem={({ item }) => (
            <CouponCard coupon={item} onPress={handleOpenCouponDetail} />
          )}
          ListEmptyComponent={
            <View className="py-16 items-center justify-center px-6 bg-white rounded-3xl border border-neutros-borda mt-2">
              <View className="w-16 h-16 rounded-2xl bg-consumidor/10 items-center justify-center mb-4">
                <Ionicons name="ticket-outline" size={32} color="#008D4C" />
              </View>
              <Text className="text-base font-bold text-neutros-texto text-center">
                {selectedTab === 'ACTIVE'
                  ? 'Você não possui cupons ativos'
                  : selectedTab === 'USED'
                    ? 'Nenhum cupom utilizado até o momento'
                    : selectedTab === 'INACTIVE'
                      ? 'Nenhum cupom cancelado ou expirado'
                      : 'Nenhum cupom encontrado'}
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1 mb-6 leading-relaxed">
                Troque seus pontos acumulados em qualquer loja parceira por cupons de desconto imediatos!
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(consumer)/(tabs)/stores')}
                activeOpacity={0.8}
                className="px-6 py-3.5 bg-consumidor rounded-2xl flex-row items-center gap-2 shadow-md shadow-consumidor/20"
              >
                <Ionicons name="storefront" size={18} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm">
                  Explorar Lojas Parceiras
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
