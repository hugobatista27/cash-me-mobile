import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCustomerCoupons } from '@/hooks/useCoupons';
import { useCustomerBalances } from '@/hooks/useWallet';
import { CustomerProfile, useAuthStore } from '@/stores/use-auth-store';

export default function ConsumerHomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const customerProfile = profile as CustomerProfile | null;

  const {
    data: balances = [],
    isLoading: isLoadingBalances,
    isRefetching,
    refetch: refetchBalances,
  } = useCustomerBalances();
  const { data: activeCoupons = [], refetch: refetchCoupons } = useCustomerCoupons('ACTIVE');

  const displayName = customerProfile?.fullName || user?.email?.split('@')[0] || 'Consumidor';
  const totalPoints = balances.reduce((acc, item) => acc + Number(item.currentBalance || 0), 0);

  const handleRefresh = () => {
    refetchBalances();
    refetchCoupons();
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <ScrollView
        contentContainerClassName="p-6"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#008D4C" />
        }
      >
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

        {/* Card de Saldo de Pontos Real */}
        <View className="bg-consumidor p-6 rounded-3xl shadow-lg shadow-consumidor/20 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/80 text-sm font-medium">Pontos Disponíveis (Total)</Text>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">CashMe Club</Text>
            </View>
          </View>
          {isLoadingBalances ? (
            <ActivityIndicator color="#FFFFFF" className="my-3 self-start" />
          ) : (
            <Text className="text-white text-4xl font-extrabold tracking-tight mb-4">
              {totalPoints} <Text className="text-2xl font-normal text-white/80">pts</Text>
            </Text>
          )}
          <View className="flex-row items-center gap-2 pt-2 border-t border-white/20">
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text className="text-white/90 text-xs font-medium">
              {balances.length} {balances.length === 1 ? 'loja com saldo' : 'lojas com saldo'} (isolado por CNPJ)
            </Text>
          </View>
        </View>

        {/* Atalhos Rápidos */}
        <Text className="text-lg font-bold text-neutros-texto mb-3">Ações Rápidas</Text>
        <View className="flex-row gap-3 mb-4">
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
            <Text className="text-xs text-neutros-cinza text-center mt-1">Ofertas e regras</Text>
          </TouchableOpacity>
        </View>

        {/* Atalho Meus Cupons */}
        <TouchableOpacity
          onPress={() => router.push('/(consumer)/coupons')}
          activeOpacity={0.8}
          className="bg-white p-4 rounded-2xl border border-neutros-borda flex-row items-center justify-between shadow-sm mb-6"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-xl bg-pontos/15 items-center justify-center">
              <Ionicons name="ticket-outline" size={22} color="#B45309" />
            </View>
            <View>
              <Text className="text-sm font-bold text-neutros-texto">Meus Cupons de Desconto</Text>
              <Text className="text-xs text-neutros-cinza">
                {activeCoupons.length} {activeCoupons.length === 1 ? 'cupom ativo' : 'cupons ativos'} para usar no caixa
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#60646C" />
        </TouchableOpacity>

        {/* Lojas Recentes com Saldo */}
        {balances.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-neutros-texto">Seus Saldos por Loja</Text>
              <TouchableOpacity onPress={() => router.push('/(consumer)/(tabs)/wallet')}>
                <Text className="text-xs font-bold text-consumidor">Ver carteira</Text>
              </TouchableOpacity>
            </View>
            <View className="gap-2.5">
              {balances.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item.id}
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
                  className="bg-white p-4 rounded-2xl border border-neutros-borda flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-bold text-neutros-texto" numberOfLines={1}>
                      {item.establishment?.tradeName || 'Estabelecimento'}
                    </Text>
                    <Text className="text-xs text-neutros-cinza mt-0.5">
                      {item.establishment?.status === 'INACTIVE'
                        ? 'Loja temporariamente inativa (RN05)'
                        : 'Toque para ver extrato'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-extrabold text-consumidor">
                      {item.currentBalance} pts
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
