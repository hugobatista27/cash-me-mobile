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

import { useCustomerBalances, useCustomerInvoices } from '@/hooks/useWallet';
import {
  calculateTotalBalance,
  CustomerInvoice,
  CustomerPointBalance,
  formatTransactionDate,
} from '@/services/wallet.service';
import { CustomerProfile, useAuthStore } from '@/stores/use-auth-store';
import { formatCurrency } from '@/utils/nfceParser';

export default function ConsumerHomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const customerProfile = profile as CustomerProfile | null;

  const {
    data: balances,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
    isRefetching: isRefetchingBalances,
  } = useCustomerBalances();

  const {
    data: invoices,
    isLoading: isLoadingInvoices,
    refetch: refetchInvoices,
    isRefetching: isRefetchingInvoices,
  } = useCustomerInvoices();

  const displayName =
    customerProfile?.fullName || user?.email?.split('@')[0] || 'Consumidor';

  const totalPoints = calculateTotalBalance(balances || []);
  const recentInvoices = (invoices || []).slice(0, 5);
  const isRefetching = isRefetchingBalances || isRefetchingInvoices;

  const handleRefresh = () => {
    refetchBalances();
    refetchInvoices();
  };

  const handlePressStoreBalance = (item: CustomerPointBalance) => {
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

  const handlePressInvoice = (invoice: CustomerInvoice) => {
    router.push({
      pathname: '/(consumer)/invoice/[id]',
      params: {
        id: String(invoice.id),
        pointsAwarded: String(invoice.pointsAwarded ?? 0),
        tradeName:
          invoice.establishment?.tradeName || 'Estabelecimento Parceiro',
        accessKey: invoice.accessKey || '',
        status: invoice.status || 'PROCESSED',
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-neutros-fundo">
      <ScrollView
        contentContainerClassName="p-6 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={['#008D4C']}
            tintColor="#008D4C"
          />
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
            accessibilityLabel="Perfil do Consumidor"
            className="w-11 h-11 rounded-full bg-consumidor/10 items-center justify-center border border-consumidor/20"
          >
            <Ionicons name="person" size={20} color="#008D4C" />
          </TouchableOpacity>
        </View>

        {/* Card de Saldo de Pontos */}
        <View className="bg-consumidor p-6 rounded-3xl shadow-lg shadow-consumidor/20 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/80 text-sm font-medium">
              Pontos Acumulados
            </Text>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">CashMe Club</Text>
            </View>
          </View>

          <View className="flex-row items-baseline justify-between mb-4">
            <Text className="text-white text-4xl font-extrabold tracking-tight">
              {totalPoints.toLocaleString('pt-BR')}{' '}
              <Text className="text-2xl font-bold text-pontos">pts</Text>
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(consumer)/(tabs)/wallet')}
              className="flex-row items-center gap-1 bg-white/15 px-3 py-1.5 rounded-full"
            >
              <Text className="text-white text-xs font-bold">Ver Carteira</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2 pt-2 border-t border-white/20">
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text className="text-white/90 text-xs font-medium">
              Saldos isolados e protegidos por estabelecimento
            </Text>
          </View>
        </View>

        {/* Atalhos Rápidos */}
        <Text className="text-lg font-bold text-neutros-texto mb-3">
          Ações Rápidas
        </Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/(tabs)/scan')}
            activeOpacity={0.8}
            className="flex-1 bg-white p-4 rounded-2xl border border-neutros-borda items-center shadow-sm"
          >
            <View className="w-12 h-12 rounded-xl bg-consumidor/10 items-center justify-center mb-2">
              <Ionicons name="qr-code" size={24} color="#008D4C" />
            </View>
            <Text className="text-sm font-bold text-neutros-texto">
              Escanear Nota
            </Text>
            <Text className="text-xs text-neutros-cinza text-center mt-1">
              Ler QR Code NFC-e
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(consumer)/(tabs)/stores')}
            activeOpacity={0.8}
            className="flex-1 bg-white p-4 rounded-2xl border border-neutros-borda items-center shadow-sm"
          >
            <View className="w-12 h-12 rounded-xl bg-lojista/10 items-center justify-center mb-2">
              <Ionicons name="storefront" size={24} color="#6F35B5" />
            </View>
            <Text className="text-sm font-bold text-neutros-texto">
              Lojas Parceiras
            </Text>
            <Text className="text-xs text-neutros-cinza text-center mt-1">
              Ver regulamentos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Carrossel / Lista Rápida das Lojas onde Pontuou */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-neutros-texto">
              Suas Lojas com Saldo
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(consumer)/(tabs)/wallet')}
            >
              <Text className="text-xs font-bold text-consumidor">
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingBalances ? (
            <View className="py-6 items-center justify-center">
              <ActivityIndicator size="small" color="#008D4C" />
            </View>
          ) : balances && balances.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3"
            >
              {balances.map((item) => {
                const establishmentId =
                  item.establishment?.id ?? item.establishmentId ?? item.id;
                const tradeName =
                  item.establishment?.tradeName || 'Loja Parceira';

                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={`home-store-balance-${establishmentId}`}
                    onPress={() => handlePressStoreBalance(item)}
                    activeOpacity={0.85}
                    className="w-48 bg-white p-4 rounded-2xl border border-neutros-borda shadow-sm"
                  >
                    <View className="w-9 h-9 rounded-xl bg-consumidor/10 items-center justify-center mb-2.5">
                      <Ionicons name="storefront" size={18} color="#008D4C" />
                    </View>
                    <Text
                      className="text-sm font-extrabold text-neutros-texto mb-1"
                      numberOfLines={1}
                    >
                      {tradeName}
                    </Text>
                    <Text className="text-lg font-black text-consumidor">
                      {item.currentBalance.toLocaleString('pt-BR')}{' '}
                      <Text className="text-xs font-bold text-pontos">pts</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View className="bg-white p-5 rounded-2xl border border-neutros-borda items-center">
              <Text className="text-xs text-neutros-cinza text-center">
                Escaneie sua primeira nota fiscal para acumular pontos nas lojas
                parceiras.
              </Text>
            </View>
          )}
        </View>

        {/* Histórico Recente de Lançamentos / Notas Fiscais */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-neutros-texto mb-3">
            Notas Fiscais Recentes
          </Text>

          {isLoadingInvoices ? (
            <View className="py-6 items-center justify-center">
              <ActivityIndicator size="small" color="#008D4C" />
            </View>
          ) : recentInvoices.length > 0 ? (
            <View className="gap-2.5">
              {recentInvoices.map((invoice) => {
                const storeTitle =
                  invoice.establishment?.tradeName || 'Compra Processada';
                return (
                  <TouchableOpacity
                    key={invoice.id}
                    testID={`home-invoice-item-${invoice.id}`}
                    onPress={() => handlePressInvoice(invoice)}
                    activeOpacity={0.85}
                    className="bg-white p-4 rounded-2xl border border-neutros-borda flex-row items-center justify-between shadow-sm"
                  >
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="w-10 h-10 rounded-xl bg-consumidor/10 items-center justify-center mr-3">
                        <Ionicons
                          name="receipt-outline"
                          size={20}
                          color="#008D4C"
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-sm font-bold text-neutros-texto"
                          numberOfLines={1}
                        >
                          {storeTitle}
                        </Text>
                        <Text className="text-xs text-neutros-cinza mt-0.5">
                          {formatCurrency(invoice.totalAmount)} •{' '}
                          {formatTransactionDate(
                            invoice.issuedAt || invoice.createdAt
                          )}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <View className="bg-consumidor/10 px-2.5 py-1 rounded-full">
                        <Text className="text-xs font-extrabold text-consumidor">
                          +{invoice.pointsAwarded} pts
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="bg-white p-5 rounded-2xl border border-neutros-borda items-center">
              <Text className="text-xs text-neutros-cinza text-center">
                Nenhuma nota fiscal processada recentemente.
              </Text>
            </View>
          )}
        </View>

        {/* Informações da Conta */}
        <View className="bg-white p-5 rounded-2xl border border-neutros-borda">
          <Text className="text-base font-bold text-neutros-texto mb-2">
            Status da Sua Conta
          </Text>
          <View className="flex-row items-center justify-between py-2 border-b border-neutros-fundo">
            <Text className="text-sm text-neutros-cinza">E-mail</Text>
            <Text className="text-sm font-medium text-neutros-texto">
              {user?.email}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-2 border-b border-neutros-fundo">
            <Text className="text-sm text-neutros-cinza">Tipo de Conta</Text>
            <Text className="text-sm font-bold text-consumidor">
              Consumidor Ativo
            </Text>
          </View>
          {customerProfile?.cpf && (
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-sm text-neutros-cinza">CPF Vinculado</Text>
              <Text className="text-sm font-medium text-neutros-texto">
                {customerProfile.cpf}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
