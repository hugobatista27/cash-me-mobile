import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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

import { useCancelCoupon, useCustomerCoupons } from '@/hooks/useCoupons';
import { extractApiErrorMessage } from '@/services/api';
import { CouponRedemptionItem, formatRewardDiscount } from '@/services/coupons';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ACTIVE', label: 'Ativos' },
  { key: 'USED', label: 'Usados' },
  { key: 'CANCELLED', label: 'Cancelados' },
  { key: 'EXPIRED', label: 'Expirados' },
] as const;

export default function ConsumerCouponsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const {
    data: coupons = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useCustomerCoupons(statusFilter);
  const cancelMutation = useCancelCoupon();

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Código Copiado', `Apresente o código ${code} no caixa do estabelecimento.`);
  };

  const handleCancelCoupon = (coupon: CouponRedemptionItem) => {
    Alert.alert(
      'Cancelar Cupom',
      `Deseja cancelar o cupom ${coupon.code}? Os ${coupon.pointsCost} pontos serão estornados automaticamente para o seu saldo nesta loja.`,
      [
        { text: 'Manter Cupom', style: 'cancel' },
        {
          text: 'Confirmar Cancelamento',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(coupon.id);
              Alert.alert(
                'Cupom Cancelado',
                `${coupon.pointsCost} pontos foram estornados para o seu saldo.`
              );
            } catch (err: unknown) {
              Alert.alert(
                'Erro ao Cancelar',
                extractApiErrorMessage(err, 'Não foi possível cancelar este cupom.')
              );
            }
          },
        },
      ]
    );
  };

  const renderCoupon = ({ item }: { item: CouponRedemptionItem }) => {
    const isActive = item.status === 'ACTIVE';
    const isUsed = item.status === 'USED';
    const isStoreInactive = item.establishment?.status === 'INACTIVE';

    const statusBadge =
      item.status === 'ACTIVE'
        ? { bg: 'bg-green-100', text: 'text-green-700', label: 'Ativo' }
        : isUsed
          ? { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Utilizado' }
          : item.status === 'EXPIRED'
            ? { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Expirado' }
            : { bg: 'bg-zinc-200', text: 'text-zinc-700', label: 'Cancelado' };

    return (
      <View className="bg-white p-5 rounded-3xl border border-neutros-borda shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold text-lojista" numberOfLines={1}>
            {item.establishment?.tradeName || 'Estabelecimento Parceiro'}
          </Text>
          <View className={`px-2.5 py-0.5 rounded-full ${statusBadge.bg}`}>
            <Text className={`text-[11px] font-bold ${statusBadge.text}`}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        <Text className="text-base font-extrabold text-neutros-texto">
          {item.reward?.title || 'Cupom de Desconto'}
        </Text>
        <Text className="text-xs font-semibold text-consumidor mt-0.5">
          {formatRewardDiscount(item.reward)} • {item.pointsCost} pts
        </Text>

        {/* Código Alfanumérico */}
        <TouchableOpacity
          onPress={() => handleCopyCode(item.code)}
          activeOpacity={0.8}
          className="mt-3 p-3.5 rounded-2xl bg-neutros-fundo border border-dashed border-neutros-borda flex-row items-center justify-between"
        >
          <View>
            <Text className="text-[10px] text-neutros-cinza uppercase font-bold">
              Código para o Caixa
            </Text>
            <Text className="text-xl font-black tracking-widest text-neutros-texto mt-0.5">
              {item.code}
            </Text>
          </View>
          <Ionicons name="copy-outline" size={20} color="#008D4C" />
        </TouchableOpacity>

        <Text className="text-[11px] text-neutros-cinza mt-2.5">
          Validade: {new Date(item.expiresAt).toLocaleDateString('pt-BR')}
        </Text>

        {isStoreInactive && isActive && (
          <View className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <Text className="text-[11px] text-amber-800 font-medium">
              Parceiro temporariamente inativo (RN11). Você pode cancelar este cupom para estornar seus pontos.
            </Text>
          </View>
        )}

        {isActive && (
          <TouchableOpacity
            onPress={() => handleCancelCoupon(item)}
            disabled={cancelMutation.isPending}
            className="mt-3 py-2.5 rounded-xl border border-red-200 bg-red-50 items-center"
          >
            <Text className="text-xs font-bold text-red-600">Cancelar e Estornar Pontos</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-neutros-borda/60">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(consumer)/(tabs)'))}
          className="w-10 h-10 rounded-full bg-neutros-fundo items-center justify-center border border-neutros-borda"
        >
          <Ionicons name="arrow-back" size={20} color="#171717" />
        </TouchableOpacity>
        <Text className="text-base font-extrabold text-neutros-texto">Meus Cupons</Text>
        <View className="w-10" />
      </View>

      {/* Filtros */}
      <View className="px-6 py-3 flex-row gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full border ${
                active
                  ? 'bg-consumidor border-consumidor'
                  : 'bg-white border-neutros-borda'
              }`}
            >
              <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-neutros-cinza'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#008D4C" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-sm font-semibold text-red-600">
            Erro ao carregar seus cupons.
          </Text>
          <TouchableOpacity onPress={() => refetch()} className="mt-3 px-4 py-2 bg-consumidor rounded-xl">
            <Text className="text-white text-xs font-bold">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCoupon}
          contentContainerClassName="px-6 pb-8"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#008D4C" />
          }
          ListEmptyComponent={
            <View className="bg-white p-8 rounded-3xl border border-neutros-borda items-center mt-4">
              <Ionicons name="ticket-outline" size={32} color="#B45309" />
              <Text className="text-sm font-bold text-neutros-texto mt-3 text-center">
                Nenhum cupom encontrado
              </Text>
              <Text className="text-xs text-neutros-cinza text-center mt-1 mb-4">
                Explore as lojas parceiras para trocar seus pontos por descontos.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(consumer)/(tabs)/stores')}
                className="px-5 py-2.5 bg-lojista rounded-xl"
              >
                <Text className="text-white text-xs font-bold">Explorar Lojas</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
